//----------------//
//-- Global var --//
//----------------// 

var express = require("express"),
    app = new express(),
    bodyParser = require("body-parser"),
    http = require("http").Server(app),
    io = require("socket.io")(http),
    port = process.env.PORT || 3000;

//-----------------//
//-- Socket part --//
//-----------------// 

//-- Called when the user is connecting to socket.io.
io.on("connection", function(socket){
    
    //-- Count video packets received. 
    var nbPackets = 0
    
    //-- Add a username to socket when user is coming.
    socket.on("set_username", function(username){
        socket.username = username;
    });

    //-- Streamer send video buffer && nb video packets sent.
    socket.on("video", function(room, image, nbVideoPackets){   
        socket.nbVideoPackets = nbVideoPackets;                     //-- Add this information to the socket.
        socket.emit("nb_video_packets", nbVideoPackets);            //-- Send directly the numbers of packets.
        socket.broadcast.to(room).emit("video", image);             //-- Broadcast the image to every users in the room.
    });

    //-- Streamer send audio buffer.
    socket.on("audio", function(room, audio){
        socket.broadcast.to(room).emit("audio", audio);             //-- Broadcast the audio to every users in the room.
    });
    
    //-- Viewer send a message.
    socket.on("message", function(room, sender, message){
        io.sockets.in(room).emit("new_message", sender, message);   //-- Viewer broadcast a message text to everyone and the streamer too.
    });

    //-- Viewer join the stream socket.
    socket.on("stream", function(room){
        socket.join(room);                                          //-- Viewer is joining the room.
        var roomList = [];                                          //-- Create users room list array.
        var roomIds = getAllRoomMembers(room);                      //-- Call getAllRoomMembers method and save the result.
        for (var socketId in roomIds.sockets) {                     //-- Loop on every socket in the room to find out usernames.
            var theSocket = io.sockets.connected[socketId]
            var theUsername = theSocket.username;
            if(theUsername != null) {
                roomList.push(theUsername);                         //-- Push the username in the roomList.
            } 
        }
        io.sockets.in(room).emit("get_all_room_members", roomList); //-- Emit the result everytime a user is joining the stream.      
    });

    //-- User leave the stream socket (We make exactly the same as above).
    socket.on("leave_stream", function(room){
        socket.leave(room);
        var roomList = [];
        var roomIds = getAllRoomMembers(room);
        for (var socketId in roomIds.sockets) {
            var theSocket = io.sockets.connected[socketId]
            var theUsername = theSocket.username;
            if(theUsername != null) {
                roomList.push(theUsername);   
            } 
        }
        console.log(roomList);
        io.sockets.in(room).emit("get_all_room_members", roomList);    
    });
});

//-------------//
//-- Methods --//
//-------------//

//-- Simple method to return all sockets in a room.
function getAllRoomMembers(room){
    var theRoom = io.sockets.adapter.rooms[room];
    return theRoom;
}

//-------------------//
//-- Http listener --//
//-------------------//

//-- Http have to listen a port.
http.listen(port, function(){
    log.info('Server is listening the port %s', port);
});
 
 
    
    