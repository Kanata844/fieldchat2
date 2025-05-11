// @ts-check
class Entity {
    id;
    x;
    y;
    speed = 2;
    image;
    defaultColor;
    color;
    email;
    username;

    constructor(email, username, x, y, color) {
        this.defaultColor = color;
        this.color = color;
        this.x = x;
        this.y = y;
        this.email = email;
        this.username = username;
    }

    moveRandom() {
        this.x = Math.trunc(Math.random() * 1400);
        this.y = Math.trunc(Math.random() * 700);
    }

    up() {
        this.y -= this.speed;
    }
    down() {
        this.y += this.speed;
    }
    right() {
        this.x += this.speed;
    }
    left() {
        this.x -= this.speed;
    }

    setColor(color) {
        this.color = color;
    }

    setDefaultColor(){
        this.color = this.defaultColor;
    }

    draw(context) {
        context.fillStyle = this.color;
        context.beginPath();
        context.arc(this.x, this.y, 20, 0, 2 * Math.PI);
        context.closePath();
        context.fill();
    }

    collisionDetect(e) {
        return Math.sqrt((this.x - e.x) * (this.x - e.x) + (this.y - e.y) * (this.y - e.y)) <= 40;
    }

    getx(){
        return this.x;
    }

    gety(){
        return this.y;
    }
}

class Page{
    body;
}

class SettingPage extends Page{
    myEmail;
    myUserName;
    myColor;

    constructor(myEmail, myUserName, myColor){
        super();
        this.myEmail = myEmail;
        this.myUserName = myUserName;
        this.myColor = myColor;
        this.launch();
    }

    launch(){
        this.body = document.getElementById("body");
        const h1 = document.createElement("h1");
        h1.textContent = "色の設定";
        this.body.appendChild(h1);
        const selectColor = document.createElement("input");
        selectColor.type = "color";
        selectColor.value = this.myColor;
        this.body.appendChild(selectColor);
        const save = document.createElement("button");
        this.body.appendChild(save);
        save.onclick = async() => {
            const response = await fetch("/setcolor", {
                method: "post",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({email: this.myEmail, color: selectColor.value})
            });
            const text = await response.text();
            alert(text);
        };
        save.textContent = "保存";
        const exit = document.createElement("button");
        this.body.appendChild(exit);
        exit.onclick = () => {
            this.destroy();
            new FieldPage(this.myEmail, this.myUserName);
        }
        exit.textContent = "戻る";
    }

    destroy(){
        this.body.innerHTML = "";
    }
}

class ChatPage extends Page{
    myEmail;
    myName;
    yourEmail;
    yourName;

    timer;

    h1;
    div;
    input;
    button_send;
    button_back;

    constructor(myEmail, myName, yourEmail, yourName){
        super();
        this.myEmail = myEmail;
        this.myName = myName;
        this.yourEmail = yourEmail;
        this.yourName = yourName;
        this.launch();
    }

    launch(){
        this.body = document.getElementById("body");
        this.h1 = document.createElement("h1");
        this.h1.textContent = this.yourName;
        this.body.appendChild(this.h1);
        this.div = document.createElement("div");
        this.body.appendChild(this.div);
        this.input = document.createElement("input");
        this.body.appendChild(this.input);
        this.button_send = document.createElement("button");
        this.body.appendChild(this.button_send);
        this.button_send.textContent = "送信";
        this.button_back = document.createElement("button");
        this.body.appendChild(this.button_back);
        this.button_back.textContent = "戻る";

        this.button_send.onclick = async() => {
            if(this.input.value !== ""){
                const text = this.input.value;
                this.input.value = "";
                const json = JSON.stringify({email_speaker: this.myEmail, name_speaker: this.myName, email_listener: this.yourEmail, name_listener: this.yourName, message: text});
                await fetch("/sendmessage", {
                    method: "post",
                    headers: {"Content-Type": "application/json"},
                    body: json
                });
            }
        }
        this.button_back.onclick = () => {
            this.destroy();
            new FieldPage(this.myEmail, this.myName);
        }
        this.timer = setInterval(async() => {
            const json = JSON.stringify({email_speaker: this.myEmail, email_listener: this.yourEmail});
            const response = await fetch("/getmessage", {
                method: "post",
                headers: {"Content-Type": "application/json"},
                body: json
            });
            const text = await response.text();
            const messages = JSON.parse(text);
            this.div.innerHTML = "";
            for(let i = 0; i < messages.length; i++){
                const p = document.createElement("p");
                if(messages[i].email_speaker === this.myEmail){
                    p.className = "me";
                }
                else{
                    p.className = "you";
                }
                
                this.div.appendChild(p);
                p.textContent = messages[i].message;
            }
        }, 1000);
    }

    destroy(){
        clearInterval(this.timer);
        this.body.innerHTML = "";
    }

}

class FieldPage extends Page{
    canvas;
    context;
    player;
    npcs;
    email_player;
    username_player;

    eventHandler;

    timer;

    constructor(email, username){
        super();
        this.email_player = email;
        this.username_player = username;
        this.launch();
    }

    async getUsers() {
        const response = await fetch("/users");
        const json = await response.text();
        console.log(json);
        const array = JSON.parse(json);
        return array;
    }

    async setUsers(){
        const array = await this.getUsers();
        this.npcs = [];
        for (let i = 0; i < array.length; i++) {
            if(array[i].email === this.email_player){
                this.player = new Entity(array[i].email, array[i].username, array[i].x, array[i].y, array[i].color);
            } else {
                this.npcs.push(new Entity(array[i].email, array[i].username, array[i].x, array[i].y, array[i].color));
            }
        }
        this.drawEntities();
    }

    async setUsersExceptMyself(){
        const array = await this.getUsers();
        console.log(this.npcs);
        this.npcs = [];
        for (let i = 0; i < array.length; i++) {
            if(array[i].email !== this.email_player){
                this.npcs.push(new Entity(array[i].email, array[i].username, array[i].x, array[i].y, array[i].color));
            }
        }
        console.log(array);
    }

    async saveCurrentPositionOfPlayer(){
        await fetch("/save", {
            method: "post",
            headers: { "Content-Type": "application/json"},
            body: JSON.stringify({email: this.email_player, username: this.username_player, x: this.player.getx(), y: this.player.gety()})
        });
    }

    drawEntities(){
        this.context.clearRect(0,0, this.canvas.width, this.canvas.height);
        this.context.fillStyle = "#00ff00";
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.player.draw(this.context);
        
        for (let i = 0; i < this.npcs.length; i++) {
            if (this.npcs[i].collisionDetect(this.player)) {
                this.npcs[i].setColor("blue");
            }
            else {
                this.npcs[i].setDefaultColor();
            }
            this.npcs[i].draw(this.context);
        }
    }

    async tryChatting(){
        for(let i = 0; i < this.npcs.length; i++){
            if(this.npcs[i].collisionDetect(this.player)){
                this.destroy();
                console.log(this.player.username);
                new ChatPage(this.player.email, this.player.username, this.npcs[i].email, this.npcs[i].username);
                await this.saveCurrentPositionOfPlayer();
                break;
            }
        }
    }

    launch = async () => {
        this.body = document.getElementById("body");
        const button = document.createElement("button");
        button.onclick = async() => {
            this.player.moveRandom();
        };
        this.body.appendChild(button);
        button.textContent = "フィールド内のランダムな場所に移動";
        const setting = document.createElement("button");
        setting.onclick = () => {
            this.destroy();
            new SettingPage(this.email_player, this.username_player, this.player.color);
        }
        this.body.appendChild(setting);
        setting.textContent = "設定"
        this.canvas = document.createElement("canvas");
        this.canvas.width = 1400;
        this.canvas.height = 700;
        if(this.body !== null){
            this.body.appendChild(this.canvas);
        }
        this.context = this.canvas.getContext("2d");
        await this.setUsers();
        this.eventHandler = async (e) => {
            if(this.context !== null){
                this.context.clearRect(0, 0, this.canvas.clientWidth, this.canvas.height);
            }
            switch (e.key) {
                case "w":
                    this.player.up();
                    break;
                case "a":
                    this.player.left();
                    break;
                case "s":
                    this.player.down();
                    break;
                case "d":
                    this.player.right();
                    break;
                case "Enter":
                    await this.tryChatting();
                    break;
            }
            this.player.draw(this.context);
        
            this.drawEntities();
        };
        document.addEventListener("keydown", this.eventHandler);

        this.timer = setInterval(() => {
            this.saveCurrentPositionOfPlayer();
            this.setUsersExceptMyself();
            this.drawEntities();
        }, 1000);
        
    }

    async destroy() {
        clearInterval(this.timer);
        this.body.innerHTML = "";
        document.removeEventListener("keydown", this.eventHandler);
    }
}

class SignUpPage extends Page{

    input_email;
    input_username;
    input_password;
    button;
    signInButton;

    str_email;
    str_username;
    str_password;

    constructor(){
        super();
        this.launch();
    }

    launch(){
        this.body = document.getElementById("body");
        this.body.innerHTML=`
            <h4>サインアップ</h4>
            <div>
                <p>メールアドレス</p>
                <input id="email" />
            </div>
            <div>
                <p>ユーザーネーム</p>
                <input id="username" />
            </div>
            <div>
                <p>パスワード</p>
                <input id="password" type="password"/>
            </div>
            <button id="button">送信</button>
            <button id="sign_in">サインインページへ</button>
        `
        this.input_email = document.getElementById("email");
        this.input_username = document.getElementById("username");
        this.input_password = document.getElementById("password");
        this.button = document.getElementById("button");
        this.signInButton = document.getElementById("sign_in");
        this.button.onclick = async () => {
            if(this.input_email.value !== "" && this.input_username.value !== "" && this.input_password.value !== ""){
                const json_request = JSON.stringify({email: this.input_email.value, username: this.input_username.value, password: this.input_password.value});
                const response = await fetch("/signUp", {
                    method: "post",
                    headers: {"Content-Type": "application/json" },
                    body: json_request
                });
                const text = await response.text();
                const json_response = JSON.parse(text);
                if(json_response.status === "success"){
                    alert("成功しました");
                    this.destroy();
                    new FieldPage(json_response.email, json_response.username);
                }
                else{
                    alert("失敗しました");
                }
            }
        }
        this.signInButton.onclick = () => {
            this.destroy();
            new SignInPage();
        }
    }

    destroy(){
        this.body.innerHTML="";
    }
    
}

class SignInPage extends Page{

    input_email;
    input_password;
    button;
    signUpButton;

    constructor(){
        super();
        this.launch();
    }

    launch(){
        this.body = document.getElementById("body");
        this.body.innerHTML=`
            <h4>サインイン</h4>
            <div>
                <p>メールアドレス</p>
                <input id="email" />
            </div>
            <div>
                <p>パスワード</p>
                <input id="password" type="password"/>
            </div>
            <button id="button">送信</button>
            <button id="sign_up">サインアップページへ</button>
        `

        this.input_email = document.getElementById("email");
        this.input_password = document.getElementById("password");
        this.button = document.getElementById("button");
        this.signUpButton = document.getElementById("sign_up");
        this.button.onclick = async () => {
            if(this.input_email.value !== "" && this.input_password.value !== ""){
                const json_request = JSON.stringify({email: this.input_email.value, password: this.input_password.value});
                const response = await fetch("/signIn", {
                    method: "post",
                    headers: {"Content-Type": "application/json" },
                    body: json_request
                });
                const text = await response.text();
                const json_response = JSON.parse(text);
                if(json_response.status === "success"){
                    alert("成功しました");
                    this.destroy();
                    new FieldPage(json_response.email, json_response.username);
                }
                else{
                    alert(json_response.message);
                }
            }
        }
        this.signUpButton.onclick = () => {
            this.destroy();
            new SignUpPage();
        }
    }

    destroy(){
        this.body.innerHTML="";
    }
    
}

//const fieldPage = new FieldPage();
const signUpPage = new SignUpPage();

