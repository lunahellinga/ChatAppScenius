import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {User} from "../_models/user";
import {environment} from "../../environment";
import {ReplaySubject} from "rxjs";
import {coerceToArrayBuffer, coerceToBase64Url} from "../helpers";
import {Router} from "@angular/router";
import {routes} from "../app.routes";

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  baseUrl = environment.apiUrl;
  private currentUserSource = new ReplaySubject<User|null>(1);
  currentUser$ = this.currentUserSource.asObservable();

  constructor(private router: Router) {
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
      makeCredentialOptions = await this.fetchMakeCredentialOptions(data);

    } catch (e) {
      console.error(e);
      let msg = "Something wen't really wrong";
    }

    console.log("Credential Options Object", makeCredentialOptions);

    if (makeCredentialOptions.status !== "ok") {
      console.log("Error creating credential options");
      console.log(makeCredentialOptions.errorMessage);
      return;
    }

    // Turn the challenge back into the accepted format of padded base64
    makeCredentialOptions.challenge = coerceToArrayBuffer(makeCredentialOptions.challenge);
    // Turn ID into a UInt8Array Buffer for some reason
    makeCredentialOptions.user.id = coerceToArrayBuffer(makeCredentialOptions.user.id);

    makeCredentialOptions.excludeCredentials = makeCredentialOptions.excludeCredentials.map((c: any) => {
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
    }


    console.log("PublicKeyCredential Created", newCredential);

    try {
      this.registerNewCredential(newCredential);

    } catch (e) {
      console.log(e)
    }
  }

  async fetchMakeCredentialOptions(formData: FormData) {
    let response = await fetch(this.baseUrl + '/pakeCredentialOptions', {
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
  async registerNewCredential(newCredential: any) {
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
      response = await this.registerCredentialWithServer(data);
    } catch (e) {
      console.log(e)
    }

    console.log("Credential Object", response);

    // show error
    if (response.status !== "ok") {
      console.log("Error creating credential");
      console.log(response.errorMessage);
      return;
    }

    // redirect to dashboard?
    //window.location.href = "/dashboard/" + state.user.displayName;
  }

  async registerCredentialWithServer(formData: any) {
    let response = await fetch(this.baseUrl + '/makeCredential', {
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
      const res = await fetch(this.baseUrl + '/assertionOptions', {
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
    makeAssertionOptions.allowCredentials.forEach(function (listItem: any) {
      const fixedId = listItem.id.replace(/\_/g, "/").replace(/\-/g, "+");
      listItem.id = Uint8Array.from(atob(fixedId), c => c.charCodeAt(0));
    });

    console.log("Assertion options", makeAssertionOptions);


    // ask browser for credentials (browser will ask connected authenticators)
    let credential;
    try {
      credential = await navigator.credentials.get({publicKey: makeAssertionOptions})
    } catch (err) {
      console.log(err)
    }

    try {
      await this.verifyAssertionWithServer(credential);
    } catch (e) {
      console.log(e)
    }
  }

  async verifyAssertionWithServer(assertedCredential: any) {

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
      let res = await fetch(this.baseUrl + "/makeAssertion", {
        method: 'POST', // or 'PUT'
        body: JSON.stringify(data), // data can be `string` or {object}!
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      response = await res.json();
    } catch (e) {
      console.log(e)
      throw e;
    }

    console.log("Assertion Object", response);

    // show error
    if (response.status !== "ok") {
      console.log("Error doing assertion");
      console.log(response.errorMessage);
      console.log(response.errorMessage)
      return;
    }
    else {
      this.setCurrentUser(response.user);
    }
  }


  setCurrentUser(user: User) {
    localStorage.setItem('user', JSON.stringify(user));
    this.currentUserSource.next(user);
  }

  logout() {
    localStorage.removeItem('user');
    this.currentUserSource.next(null);
  }

  getDecodedToken(token: any) {
    return JSON.parse(atob(token.split('.')[1]));
  }
}
