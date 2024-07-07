import { Application } from "./App.js";

const app = new Application();
window.onload = () => app.OnLoad();
window.onresize = () => app.OnWindowSizeChange();