import express, { request, response } from "express";
import { PrismaClient } from "./generated/prisma/index.js";

const app = new express();
app.use(express.static("./public"));
app.use(express.json());

const client = new PrismaClient();

/*
const users = [
    {
        id: 1,
        x: 300,
        y: 100
    },
    {
        id: 2,
        x: 200,
        y: 100
    },
    {
        id: 3,
        x: 200,
        y: 200
    }
];
*/

let requestCount = 0;
let timeElapsed = 0;
setInterval(() => {
    timeElapsed++;
    // console.log("total:", requestCount)
    // console.log("req / s:", requestCount / timeElapsed)
}, 1000)
class Users {
    array_users = [];
    constructor() {
        this.loadUsers();
    }

    async loadUsers() {
        this.array_users = [];
        const users = await client.position.findMany();
        for (let i = 0; i < users.length; i++) {
            this.add({ email: users[i].email, username: users[i].username, x: users[i].x, y: users[i].y, color: users[i].color});
        }
    }

    add(position) {
        this.array_users.push(position);
    }

    getArray() {
        console.log(this.array_users);
        return this.array_users;
    }
}

const users = new Users();

app.post("/sendmessage", async (request, response) => {
    await client.chatroom.create({ data: { email_speaker: request.body.email_speaker, name_speaker: request.body.name_speaker, email_listener: request.body.email_listener, name_listener: request.body.name_listener, message: request.body.message } });
});

app.post("/getmessage", async (request, response) => {
    const messages = await client.chatroom.findMany();
    const obj_response = [];
    for (let i = 0; i < messages.length; i++) {
        if (messages[i].email_speaker === request.body.email_speaker && messages[i].email_listener === request.body.email_listener) {
            obj_response.push({ email_speaker: messages[i].email_speaker, name_speaker: messages[i].name_speaker, email_listener: messages[i].email_listener, name_listener: messages[i].name_listener, message: messages[i].message });
        }
        else if (messages[i].email_speaker === request.body.email_listener && messages[i].email_listener === request.body.email_speaker) {
            obj_response.push({ email_speaker: messages[i].email_speaker, name_speaker: messages[i].name_speaker, email_listener: messages[i].email_listener, name_listener: messages[i].name_listener, message: messages[i].message });
        }
    }
    response.send(JSON.stringify(obj_response));
});

app.get("/users", async (request, response) => {
    await users.loadUsers();
    response.send(JSON.stringify(users.getArray()));
});

app.post("/setcolor", async(request, response) => {
    await client.position.update({where: {email: request.body.email}, data: {color:request.body.color}});
    response.send("変更しました");
});

app.post("/signUp", async (request, response) => {
    //response.send(`名前：${request.body.username}、Eメール：${request.body.email}`);
    const user = await client.user.findUnique({
        where: {
            email: request.body.email
        }
    });
    if (user === null) {
        await client.user.create({ data: { email: request.body.email, username: request.body.username, password: request.body.password } });
        const obj_position = { email: request.body.email, username: request.body.username, x: Math.trunc(Math.random() * 1400), y: Math.trunc(Math.random() * 700), color: "red"};
        await client.position.create({ data: obj_position });
        users.add(obj_position);
        const message = { status: "success", email: request.body.email, username: request.body.username };
        response.json(message);
    }
    else {
        const message = { status: "failed" };
        response.json(message);
    }
});

app.post("/signIn", async (request, response) => {
    const user = await client.user.findUnique({
        where: {
            email: request.body.email
        }
    });
    if (user !== null && request.body.password === user.password) {
        const message = { status: "success", email: request.body.email, username: request.body.username };
        response.json(message);
    }
    else {
        const message = { status: "failed", message: "メールアドレスかパスワードが間違っています" };
        response.json(message);
    }
});

app.post("/save", async (request, response) => {
    requestCount++;
    console.log(request.body)
    const result = await client.position.update({ where: { email: request.body.email }, data: { x: request.body.x, y: request.body.y } });
    console.log(result, "☆", "total:", requestCount);
    response.send("ok")
});

app.listen(3000);