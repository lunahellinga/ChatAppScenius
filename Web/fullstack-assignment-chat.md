# [FullStack] Assignment - Chat

### Intro

Thank you for taking the time for this assessment. Below is a simple yet elaborate full-stack application. We are already somewhat confident in your coding skills, but given our shared intention to work together for an extended period we also would like to 'trust, but verify'.

This assignment could take up to a day. We don't mind if you skip/replace parts and put a little justification in the readme.md as to why that had your prefference.

#### Objective

Develop a real-time chat application using C#, Angular, and Entity Framework, running in a Dockerized environment with Postgres as the database. The application should feature a secure, stateless session management system and support WebAuthn for user authentication.

#### Requirements


1. **Repository Setup:**
   * Use a hosted Git SaaS platform (GitHub, GitLab, Bitbucket, w/e) for SCM. One branch is fine, multiple commits has our preference
2. **The stack:**
   * Backend: C# with the latest .NET.
   * Frontend: Angular with Tailwind
   * Use Entity Framework for ORM.
3. **Docker Integration (Optional):**
   * Create a

     ```javascript
     docker-compose.yml
     ```

     that allows us to

     ```javascript
     docker compose up -d
     ```

     and then view the application on port 8080. Both public docker registries or the

     ```javascript
     build
     ```

     command are thumbs up.
4. **Database Setup:**
   * Use Postgres as the primary database.
   * Ensure the database schema supports storing WebAuthn credentials and chat messages.
5. **User Interface:**
   * It's allowed to look like you don't care, but if it doesn't, bonus points.
   * Implement a basic user interface with Angular.
   * Use TailwindCSS for styling (bonus for quick and effective UI).
6. **Authentication:**
   * Implement a Register/Login page using WebAuthn.
   * Store authentication keys in the Postgres database.
   * Ensure sessions are stateless and secure.
7. **Chat Functionality:**
   * Each user should have a unique identifier and the ability to set their display name.
   * Implement a chatroom where users can chat in real-time.
   * (Optional) Store chat messages in the database and resync them when the user authenticates
   * Utilize websockets for real-time communication, alternatively and less preferred is HTTP polling.
   * (Optional) A basic unit test to test any of the chat features
8. **Documentation:**
   * Provide a README.md file with setup instructions and a brief overview of the project architecture.
   * Include any necessary commands to run the project locally

#### Bonus Features


1. **Deployment and Management:**
   * Create a Helm chart for Kubernetes deployment.
   * Set up the application on a cloud platform if you happen to have one on hand.
2. **Continuous Integration/Continuous Deployment (CI/CD):**
   * Implement a CI/CD pipeline using tools like Jenkins, GitLab CI, or GitHub Actions to build the images or even deploy them
3. **Bonus realm:**
   * Feel free to add any creative features that could enhance the user experience or application functionality. Some ideas:
     * Implement PGP in the frontend to allow users to sign messages. Allow users to upload their PGP public key.
     * Add a simple chatbot for automated responses or assistive features.