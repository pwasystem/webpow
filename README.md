# WebpoW 

## Documentation Under Construction

## Overview

This project is a content manager designed to create a Progressive Web App development platform and provide a simple way to manage applications, groups and users.

|||
|-|-|
| ![](https://webpow.web.app/screen.png) |Its development was designed to facilitate the creation of a structure that serves as a starting point for developing web applications using HTML and JavaScript without the need to develop an access control structure.<br><br>The project uses the Google Firebase structure and the Spark plan, which is free, so it is possible to develop a minimum viable product without having to invest in infrastructure.|

## Why use?

The project is 100% free and only requires a little knowledge about the Google Firebase tool and can be implemented easily.

## What I need?

You must have a Google account, preferably <b>without</b> billing activated.

If billing is enabled you may be charged for the project.

## What should I know?

To be able to implement the system it is necessary to have some knowledge of the Google Firebase platform, as it will serve as the basis for WebpoW.

Some parts of the installation process are easier to do directly in the Firebase console, you will only need the Firebase CLI to upload the files to the server, then you will need to have Node JS installed in your development environment.

To develop your applications you need knowledge of HTML and JavaScript, however you can add the framework of your choice to carry out the development.


## Start using now!

### Configuring the application environment in Google Firebase

1. Access the [firebase console](https://console.firebase.google.com/) and create a project by clicking on "Add project".

- Add a name to your project.
- Leave Google Analytics activated.
- Select an account for Analytics and click create project.

2. After creating your project, you must create a web application, to do this click on the icon </> on the phrase "Add an app to get started".

- On the next screen, fill in your application details and add Firebase Hosting to your application.<br>
- You can skip step 2 of creating "Add Firebase SDK".<br>
- Install the Firebase CLI on your computer, it will be useful for deploying your files.<br>
- In step 4, just log in, the files will be sent later.

3. Now that the hosting is created, it is necessary to activate user authentication using email and password. To do this, access the Google Authentication configuration page (https://console.firebase.google.com/project/YOUR-PROJECT-NAME/authentication) and click "Get Started".

- Click on the "Email/Password" button.
- Then activate Email/Password authentication and click save. 

4. All your project information and systems will be stored in a Firestore database, you must activate it at https://console.firebase.google.com/project/YOUR-PROJECT-NAME/firestore and click "Create Database".

- Select the region where your database will be created and in the security rules preferences select the **"Start in test mode"** option and click Create.

<p align=center><b>Ready! The Google Firebase Environment is now ready to receive your application.</b></p>

### Clone WebpoW using the mitosis application.

Now that you have created the environment for WebpoW, it is time to create your copy of the system.

1. The first is to access your app settings in your Firebase project settings. This can be done by clicking on the gear icon and then on the "Project Settings" option.

2. Find the "SDK setup and configuration" option for your web application at the bottom of the "General" page and check the "Config" option and copy the data to the clipboard.

3. After copying the project settings, access the Mitosis tool of the system [WebpoW](https://webpow.web.app/#mitosis) available at: [https://webpow.web.app/#mitosis](https ://webpow.web.app/#mitosis)

4. Fill in your project data:

- Project Name: enter the name of your project, it will be used in the title tag.
- Project Description: write a short description of your project for the description meta tag.
- Keywords: choose the words for the keywords meta tag on your website.
- Author: Your name or the name of your company.
- Email: Will be used to log in to the system as an administrator after activation.
- Password: password for the email above. Write down the data.
- Connection String: Paste your project settings here, the ones you copied initially.

5. Now you need to adjust the layout details of your new system, to do this click on the images to replace them and change the theme and background colors of your system.

- Logo: The image will be adjusted to a fixed height and resized proportionally.
- Theme color and background: You will select the basic colors of your project, change the values ​​and have fun.
- Manifest logo: These images will be used to make the icons for your application, for this you need to send a square image. The image inside the circle is used to check how it will look when cut, increase the edges of the image so that it fits the circle.

6. When all information has been changed, click "Clone".

7. Close the warning box and click download and save your files to deploy. The files created have unique keys compatible only with your project, so keep these files well.

8. After unzipping the files, deploy your project through the Firebase CLI using the command:

- Firebase login: Login to the Firebase CLI
- Firebase deploy: sends the files and configures the environment.

9. The system will take a few minutes to create the database and all the relationship rules between the tables. After that, access the system at: https://YOUR_HOSTING.web.app. and log in with the credentials used to clone the system to log in to WebpoW.

## How to use?





