# MMM-MyTasklist
This a module for [Magic Mirror²](https://github.com/MichMich/MagicMirror). </br>
This displays a simple Tasklist, you can update through a web frontend.

<img width="319" height="202" alt="image" src="https://github.com/user-attachments/assets/e76f7664-4f41-49d2-b4f6-5a76922591c0" />
</br></br>
<img width="734" height="380" alt="image" src="https://github.com/user-attachments/assets/dd298d42-a51d-4ee2-9d2a-40d49dc88054" />

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
  header: "MyTaskList",
  disabled: false,
  config: {
    tasksFile: "modules/MMM-MyTasklist/tasks.json",
    updateInterval: 300000,
    showCompleted: true,
    maxTasks: null
  }
},
```
## Load Webinterface for updating the Tasklist
Open a browser and type ```http://serverip address:8123``` </br>
So if for example you're MagicMirror is on 192.168.0.48 then you go to ```http://192.168.0.48:8123``` </br>
The Webinterface for MyTasklist will be loaded and you will be able to:

* choose language for the Webinterface
* add tasks
* complete tasks
* delete tasks
* move the order from tasks by drag-and-drop
* filter on all, active or done tasks

All the updates are instantly published on your Mirror

NOTE: </br>
With a touchscreen you're able to check the checkboxes on the Mirror to complete the task. </br>
All these changes are instantly published to the Webinterface
