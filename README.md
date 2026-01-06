# MMM-MyTasklist

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
  config: {
    updateInterval: 5000,
    showCompleted: true,
    emptyMessage: "🎉 Geen taken!"
  }
}
```

