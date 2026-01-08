# MMM-MyTasklist
This a module for [Magic Mirror²](https://github.com/MichMich/MagicMirror). </br>
This displays a simple Tasklist, you can update through a web frontend.

<img width="319" height="202" alt="image" src="https://github.com/user-attachments/assets/e76f7664-4f41-49d2-b4f6-5a76922591c0" />
</br></br>
<img width="721" height="370" alt="image" src="https://github.com/user-attachments/assets/10c2eff4-4286-461f-8333-f0ae098d36c7" />


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
    tasksFile: "modules/MMM-MyTasklist/tasks.json",  // Taskfile to use
    updateInterval: 300000,                          // Update every 5 minutes
    showCompleted: true,                             // Show completed tasks -> true / false
    maxTasks: null                                   // Maximum tasks to show -> null = all or use number
  }
},
```
## Load Webinterface for updating the Tasklist
Open a browser and type ```http://serverip address:8448``` </br>
So if for example you're MagicMirror is on 192.168.0.48 then you go to ```http://192.168.0.48:8448``` </br>
The Webinterface for MyTasklist will be loaded and you will be able to:

<img width="22" height="22" alt="image" src="https://github.com/user-attachments/assets/15a6e857-90fe-43d0-bc5a-22231cea98bd" />
choose language for the Webinterface</br>
<img width="22" height="22" alt="image" src="https://github.com/user-attachments/assets/15a6e857-90fe-43d0-bc5a-22231cea98bd" />
add tasks</br>
<img width="22" height="22" alt="image" src="https://github.com/user-attachments/assets/15a6e857-90fe-43d0-bc5a-22231cea98bd" />
complete tasks</br>
<img width="22" height="22" alt="image" src="https://github.com/user-attachments/assets/15a6e857-90fe-43d0-bc5a-22231cea98bd" />
delete tasks</br>
<img width="22" height="22" alt="image" src="https://github.com/user-attachments/assets/15a6e857-90fe-43d0-bc5a-22231cea98bd" />
edit tasks</br>
<img width="22" height="22" alt="image" src="https://github.com/user-attachments/assets/15a6e857-90fe-43d0-bc5a-22231cea98bd" />
move the order from tasks by drag-and-drop</br>
<img width="22" height="22" alt="image" src="https://github.com/user-attachments/assets/15a6e857-90fe-43d0-bc5a-22231cea98bd" />
filter on all, active or done tasks</br>

</br>
All the updates are instantly published on your Mirror
</br></br>
NOTE: </br>
With a touchscreen you're able to check the checkboxes on the Mirror to complete the task. </br>
All these changes are instantly published to the Webinterface

## Versions
v1.0.0  - Initial release </br>
v1.1.0  - Update Look & Feel </br>
v1.1.1  - Change Webinterface port from 8123 to 8448 </br>
v1.2.0  - Add possibility to edit the tasks in the Webinterface </br>

