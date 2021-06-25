//we will include websocket Server
var webSocketServ = require('ws').Server;
//if we cancel the call data.name is different person and conn.name is me
//if other person rejects the call conn.name will be his name and data.name will be my name


//in accept data.name is my name and conn.name is his name who is sending me acceptance of my call

// at the port 5000
var wss = new webSocketServ({
    port: 5000
})

var users = {};
var otherUser;

//once the connection is established
wss.on('connection', function (conn) {
    console.log("User connected");

    conn.on('message', function (message) {
        var data;

        try {
            data = JSON.parse(message);
        } catch (e) {
            console.log("Invalid JSON");
            data = {};
        }

        switch (data.type) {

            case "login":
                if (users[data.name]) {
                    sendToOtherUser(conn, {
                        type: "login",
                        success: false
                    })
                } else {
                    users[data.name] = conn;
                    conn.name = data.name

                    sendToOtherUser(conn, {
                        type: "login",
                        success: true
                    })
                }

                break;
            case "offer":

                var connect = users[data.name];
                if (connect != null) {
                    conn.otherUser = data.name;

                    sendToOtherUser(connect, {
                        type: "offer",
                        offer: data.offer,
                        name: conn.name
                    })
                }
                break;

            case "answer":

                var connect = users[data.name];

                if (connect != null) {
                    conn.otherUser = data.name
                    sendToOtherUser(connect, {
                        type: "answer",
                        answer: data.answer
                    })
                }

                break

            case "candidate":

                var connect = users[data.name];

                if (connect != null) {
                    sendToOtherUser(connect, {
                        type: "candidate",
                        candidate: data.candidate
                    })
                }
                break;
            case "reject":

                var connect = users[data.name];

                if (connect != null) {
                    sendToOtherUser(connect, {
                        type: "reject",
                        name: conn.name
                    })
                }
                break;
            case "accept":

                var connect = users[data.name];

                if (connect != null) {
                    sendToOtherUser(connect, {
                        type: "accept",
                        name: conn.name
                    })
                }
                break;
            case "leave":
                var connect = users[data.name];
                connect.otherUser = null;

                if (connect != null) {
                    sendToOtherUser(connect, {
                        type: "leave"
                    })
                }

                break;

            default:
                sendToOtherUser(conn, {
                    type: "error",
                    message: "Command not found: " + data.type
                });
                break;
        }


    })
    //connectio failed to establish
    conn.on('close', function () {
        console.log('Connection closed');
        if(conn.name){
            delete users[conn.name];
            if(conn.otherUser){
                var connect = users[conn.otherUser];
                conn.otherUser = null;

                if(conn != null){
                    sendToOtherUser(connect, {
                        type:"leave"
                    } )
                }
            }
        }
    })

    conn.send("Hello V");

})

//sending the messages to other user
function sendToOtherUser(connection, message) {
    connection.send(JSON.stringify(message))
}
