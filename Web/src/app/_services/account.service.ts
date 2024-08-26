import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {map} from "rxjs/operators";
import {User} from "../_models/user";
import {environment} from "../../environment";
import {Form} from "@angular/forms";

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  baseUrl = environment.apiUrl;
  private currentUserSource = new ReplaySubject<User>(1);
  currentUser$ = this.currentUserSource.asObservable();

  constructor(private http: HttpClient) {
  }

  async handleRegisterSubmit(userName: string, displayName: string) {

    // possible values: none, direct, indirect
    let attestation_type = "none";
    // possible values: <empty>, platform, cross-platform
    let authenticator_attachment = "";

    // possible values: preferred, required, discouraged
    let user_verification = "preferred";

    // possible values: true,false
    let require_resident_key = false;


    // prepare form post data
    const data = new FormData();
    data.append('username', userName);
    data.append('displayName', displayName ?? userName);
    data.append('attType', attestation_type);
    data.append('authType', authenticator_attachment);
    data.append('userVerification', user_verification);
    data.append('requireResidentKey', require_resident_key.toString());

    // send to server for registering
    let makeCredentialOptions;
    try {
      makeCredentialOptions = await fetchMakeCredentialOptions(data);

    } catch (e) {
      console.error(e);
      let msg = "Something wen't really wrong";
      showErrorAlert(msg);
    }


    console.log("Credential Options Object", makeCredentialOptions);

    if (makeCredentialOptions.status !== "ok") {
      console.log("Error creating credential options");
      console.log(makeCredentialOptions.errorMessage);
      showErrorAlert(makeCredentialOptions.errorMessage);
      return;
    }

    // Turn the challenge back into the accepted format of padded base64
    makeCredentialOptions.challenge = coerceToArrayBuffer(makeCredentialOptions.challenge);
    // Turn ID into a UInt8Array Buffer for some reason
    makeCredentialOptions.user.id = coerceToArrayBuffer(makeCredentialOptions.user.id);

    makeCredentialOptions.excludeCredentials = makeCredentialOptions.excludeCredentials.map((c) => {
      c.id = coerceToArrayBuffer(c.id);
      return c;
    });

    if (makeCredentialOptions.authenticatorSelection.authenticatorAttachment === null) makeCredentialOptions.authenticatorSelection.authenticatorAttachment = undefined;

    console.log("Credential Options Formatted", makeCredentialOptions);

    console.log("Creating PublicKeyCredential...");

    let newCredential;
    try {
      newCredential = await navigator.credentials.create({
        publicKey: makeCredentialOptions
      });
    } catch (e) {
      var msg = "Could not create credentials in browser. Probably because the username is already registered with your authenticator. Please change username or authenticator."
      console.error(msg, e);
      showErrorAlert(msg, e);
    }


    console.log("PublicKeyCredential Created", newCredential);

    try {
      registerNewCredential(newCredential);

    } catch (e) {
      showErrorAlert(err.message ? err.message : err);
    }
  }

  async fetchMakeCredentialOptions(formData: FormData) {
    let response = await fetch('/pwmakeCredentialOptions', {
      method: 'POST', // or 'PUT'
      body: formData, // data can be `string` or {object}!
      headers: {
        'Accept': 'application/json'
      }
    });

    let data = await response.json();

    return data;
  }


  // This should be used to verify the auth data with the server
  async registerNewCredential(newCredential) {
    // Move data into Arrays incase it is super long
    let attestationObject = new Uint8Array(newCredential.response.attestationObject);
    let clientDataJSON = new Uint8Array(newCredential.response.clientDataJSON);
    let rawId = new Uint8Array(newCredential.rawId);

    const data = {
      id: newCredential.id,
      rawId: coerceToBase64Url(rawId),
      type: newCredential.type,
      extensions: newCredential.getClientExtensionResults(),
      response: {
        AttestationObject: coerceToBase64Url(attestationObject),
        clientDataJson: coerceToBase64Url(clientDataJSON)
      }
    };

    let response;
    try {
      response = await registerCredentialWithServer(data);
    } catch (e) {
      showErrorAlert(e);
    }

    console.log("Credential Object", response);

    // show error
    if (response.status !== "ok") {
      console.log("Error creating credential");
      console.log(response.errorMessage);
      showErrorAlert(response.errorMessage);
      return;
    }

    // redirect to dashboard?
    //window.location.href = "/dashboard/" + state.user.displayName;
  }

  async registerCredentialWithServer(formData: FormData) {
    let response = await fetch('/pwmakeCredential', {
      method: 'POST', // or 'PUT'
      body: JSON.stringify(formData), // data can be `string` or {object}!
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    let data = await response.json();

    return data;
  }

  async handleSignInSubmit(userName: string) {

    // prepare form post data
    const formData = new FormData();
    formData.append('username', userName);

    // send to server for registering
    let makeAssertionOptions;
    try {
      const res = await fetch('/pwassertionOptions', {
        method: 'POST', // or 'PUT'
        body: formData, // data can be `string` or {object}!
        headers: {
          'Accept': 'application/json'
        }
      });

      makeAssertionOptions = await res.json();
    } catch (e) {
      console.log(e)
    }

    console.log("Assertion Options Object", makeAssertionOptions);

    // show options error to user
    if (makeAssertionOptions.status !== "ok") {
      console.log("Error creating assertion options");
      console.log(makeAssertionOptions.errorMessage);
      return;
    }

    // todo: switch this to coercebase64
    const challenge = makeAssertionOptions.challenge.replace(/-/g, "+").replace(/_/g, "/");
    makeAssertionOptions.challenge = Uint8Array.from(atob(challenge), c => c.charCodeAt(0));

    // fix escaping. Change this to coerce
    makeAssertionOptions.allowCredentials.forEach(function (listItem) {
      const fixedId = listItem.id.replace(/\_/g, "/").replace(/\-/g, "+");
      listItem.id = Uint8Array.from(atob(fixedId), c => c.charCodeAt(0));
    });

    console.log("Assertion options", makeAssertionOptions);


    // ask browser for credentials (browser will ask connected authenticators)
    let credential;
    try {
      credential = await navigator.credentials.get({ publicKey: makeAssertionOptions })
    } catch (err) {
      console.log(err)
    }

    try {
      await verifyAssertionWithServer(credential);
    } catch (e) {
      showErrorAlert("Could not verify assertion", e);
    }
  }

  async verifyAssertionWithServer(assertedCredential: ) {

    // Move data into Arrays incase it is super long
    let authData = new Uint8Array(assertedCredential.response.authenticatorData);
    let clientDataJSON = new Uint8Array(assertedCredential.response.clientDataJSON);
    let rawId = new Uint8Array(assertedCredential.rawId);
    let sig = new Uint8Array(assertedCredential.response.signature);
    const data = {
      id: assertedCredential.id,
      rawId: coerceToBase64Url(rawId),
      type: assertedCredential.type,
      extensions: assertedCredential.getClientExtensionResults(),
      response: {
        authenticatorData: coerceToBase64Url(authData),
        clientDataJson: coerceToBase64Url(clientDataJSON),
        signature: coerceToBase64Url(sig)
      }
    };

    let response;
    try {
      let res = await fetch("/pwmakeAssertion", {
        method: 'POST', // or 'PUT'
        body: JSON.stringify(data), // data can be `string` or {object}!
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      response = await res.json();
    } catch (e) {
      showErrorAlert("Request to server failed", e);
      throw e;
    }

    console.log("Assertion Object", response);

    // show error
    if (response.status !== "ok") {
      console.log("Error doing assertion");
      console.log(response.errorMessage);
      showErrorAlert(response.errorMessage);
      return;
    }

    // show success message
    await Swal.fire({
      title: 'Logged In!',
      text: 'You\'re logged in successfully.',
      type: 'success',
      timer: 2000
    });

    window.location.href = "/index";
  }

  setCurrentUser(user: User) {
    user.roles = [];
    const roles = this.getDecodedToken(user.token).role;
    Array.isArray(roles) ? user.roles = roles : user.roles.push(roles);
    localStorage.setItem('user', JSON.stringify(user));
    this.currentUserSource.next(user);
  }

  logout() {
    localStorage.removeItem('user');
    this.currentUserSource.next(null);
    this.presenceService.stopHubConnection();
  }

  getDecodedToken(token) {
    return JSON.parse(atob(token.split('.')[1]));
  }
}
