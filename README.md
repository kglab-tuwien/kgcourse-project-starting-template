# Knowledge Graph Course - Project Template for your project!

![Screenshot of Template UI](./doc/images/overview.png )

This project contains example code that helps you to get started with your project.
This example code displays a map of Vienna and enables to explore limited static GTFS data
for the public transport of the city of Vienna as well as some housing information.

We keep the project as simple as possible for not taking any influence 
on the architecture you will choose in your project.
Therefore, we only created an Angular 15 project, which directly loads the information from the csv/json files.
Check "How to get started" for details of setting up the project.

## How to get started 
To keep the repository small, we decided to not include any housing information or GTFS data in the project.
Therefore, you find the corresponding descriptions on how to download the information in the folders:
* src/assets/data/README.md
* helpers/wh/README.md 

After you successfully downloaded all data, make sure you have installed the Angular CLI.
If not, you find information regarding the CLI at `https://angular.io/cli`.

Then, you can build and run the project. 
Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. 
The application will automatically reload if you change any of the source files.
