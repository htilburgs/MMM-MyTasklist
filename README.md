# MMM-MyTasklist
This a module for [Magic Mirror²](https://github.com/MichMich/MagicMirror). </br>
This displays a simple Tasklist, you can update through a web frontend.

## Installation
Clone this repository in your modules folder, and install dependencies:

```
cd ~/MagicMirror/modules 
git clone https://github.com/htilburgs/MMM-MyTasklist.git
cd MMM-MyTasklist
npm install 
```
## Update
When you need to update this module:

```
cd ~/MagicMirror/modules/MMM-MyTasklist
git pull
npm install
```

## Configuration
Go to the MagicMirror/config directory and edit the config.js file.
Add the module to your modules array in your config.js.

```
{
  module: "MMM-MyTasklist",
  position: "top_left",
  header: "MyTasklist",
  disabled: false,
  config: {
      updateInterval: 300000, // 5 minuten
      showCompleted: true,
      maxTasks: null // null = geen limiet, anders bijv. 5
},

}
```
## Load update page for Tasklist
Open a browser and type ```http://serverip address:8123```
So if for example you're MagicMirror is on 192.168.0.48 then you go to ```http://192.168.0.48:8123```
The update screen for MyTasklist will be loaded and you will be able to add, complete or delete tasks.

NOTE: </br>
with a touchscreen you're able to check the checkboxes on the mainscreen to complete the task </br>

