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
Open a browser and type ```http://serverip address:8448``` </br>
So if for example you're MagicMirror is on 192.168.0.48 then you go to ```http://192.168.0.48:8448``` </br>
The Webinterface for MyTasklist will be loaded and you will be able to:

<img width="22" height="22" alt="image" src="https://github.com/user-attachments/assets/bc0a97df-229b-423f-990c-a849dea7aaa2" />
choose language for the Webinterface</br>
<img width="22" height="22" alt="image" src="https://github.com/user-attachments/assets/05770bf9-8c33-4d21-a86e-c7c09dad5d39" />
add tasks</br>
<img width="22" height="22" alt="image" src="https://github.com/user-attachments/assets/cdbd7491-fbbc-4190-a97b-19bbd0e6844d" />
complete tasks</br>
<img width="22" height="22" alt="image" src="https://github.com/user-attachments/assets/5999ddae-a767-4500-a03c-14363cc10723" />
delete tasks</br>
<img width="22" height="22" alt="image" src="https://github.com/user-attachments/assets/6a13b4c2-9d9d-461e-8be8-2042cc0f1da8" />
move the order from tasks by drag-and-drop</br>
<img width="22" height="22" alt="image" src="https://github.com/user-attachments/assets/15a6e857-90fe-43d0-bc5a-22231cea98bd" />
filter on all, active or done tasks</br>
</br>
All the updates are instantly published on your Mirror
</br></br>
NOTE: </br>
With a touchscreen you're able to check the checkboxes on the Mirror to complete the task. </br>
All these changes are instantly published to the Webinterface
