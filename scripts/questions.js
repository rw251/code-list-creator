/* jshint node: true */
"use strict";

var inquirer = require('inquirer');

module.exports = {

  "initial": [
    {
      name: "author",
      message: "Enter your name"
      },
    {
      type: "checkbox",
      name: "terminologies",
      message: "Please select the terminologies used",
      choices: [
          new inquirer.Separator(" = ICD = "),
        {
          name: "ICD9"
          },
        {
          name: "ICD10"
          },
        {
          name: "ICD11"
          },
          new inquirer.Separator(" = READ = "),
        {
          name: "ReadV2"
          },
        {
          name: "ReadV3"
          },
          new inquirer.Separator(" = SNOMED = "),
        {
          name: "SNOMED CT"
          }
        ]
      },
    {
      name: "name",
      message: "Please enter a short name for your code list"
      },
    {
      name: "description",
      message: "Please enter a description for your code list"
      }
    ]
};
