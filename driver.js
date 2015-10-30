var net = require('net');


var helper= require('./helperFunctions');

var PORT_NUMBER= 9399;
var listOfRooms = ["chat", "hottub", "test"]; 

var socketArray = [];
var socketNameToUserNameMap = {};
var userNameToRoomNameMap = {};
var roomNameToAudienceSocketArrayMap = {};

















function getUserNameForSocket(socket){
   return socketNameToUserNameMap['mysocket.' + socketArray.indexOf(socket)] ;
}



// Cleans the input of carriage return, newline
function cleanInput(data) {
  return data.toString().replace(/(\r\n|\n|\r)/gm,"");
}
 



function quit(socket){
  socket.end('Goodbye!\n');
}


function getListOfRooms(socket){
      socket.write( "<= Active rooms are: \r\n");
    for( var i=0; i < listOfRooms.length; i++){
       socket.write(" *"+ listOfRooms[i] );
       //TODO: calcualte count value here
       var count = roomNameToAudienceSocketArrayMap[listOfRooms[i]].length;
       socket.write("(" + count + ")\r\n");
      
    }
    socket.write( "<= end of list. \r\n");
}


function joinARoom(socket, cleanData){
    
    var room = cleanData.substring(cleanData.indexOf(" ") + 1, cleanData.length);
    console.log("Room Name = " + room + "\n");

    // check if this room name is valid
    if( -1 == listOfRooms.indexOf(room) ) {
      //invalid room
      // type error message and return
      socket.write( " Room with this name doesn't exist. \r\n");
      return;

    }
    // console.log("roomNameToAudienceSocketArrayMap= " + roomNameToAudienceSocketArrayMap + "\n");

    roomNameToAudienceSocketArrayMap[room].push(socket);

    if( typeof userNameToRoomNameMap[user]  !== 'undefined'){
      var i =  roomNameToAudienceSocketArrayMap[userNameToRoomNameMap[user]].indexOf(socket);
      if (i != -1) {
        console.log("Removing user from room: "+ userNameToRoomNameMap[user]+ "\n");
        roomNameToAudienceSocketArrayMap[userNameToRoomNameMap[user]].splice(i, 1);
      }
    }
    socket.write( "Joined "  + room + " ! \r\n");

    userNameToRoomNameMap[user] = room;
    audience = roomNameToAudienceSocketArrayMap[room];

    for(var i = 0; i<audience.length; i++) {
      socket.write( '<= *' + getUserNameForSocket(audience[i]) );

      if(socket === audience[i])
        socket.write( '(** this is you) \n' );
      else
        socket.write( '\n' );     
   }
}




function leaveARoom(socket){
    var user =  getUserNameForSocket(socket);
    var roomName = userNameToRoomNameMap[user];
    userNameToRoomNameMap[user] = undefined;
    socket.write( "Leaving " + roomName + "\r\n");
    
    var i =  roomNameToAudienceSocketArrayMap[roomName].indexOf(socket);
    if (i != -1) {
      console.log("Removing a user from the room. \n");
      roomNameToAudienceSocketArrayMap[roomName].splice(i, 1);
    }
}




function broadcaseMessage(socket){

    // get room
    // get list of users.

    var user =  getUserNameForSocket(socket);
    var roomName = userNameToRoomNameMap[user];
     // if room is empty then broadcast


    audience = roomNameToAudienceSocketArrayMap[roomName];
    if( typeof audience === 'undefined'){
      socket.write( '<=' +  getUserNameForSocket(socket) + ": ");
      return;

    }
        
    for(var i = 0; i<audience.length; i++) {

      if (audience[i] !== socket) {
        audience[i].write( "\r\n");
        audience[i].write('=>' + user  + " : "+ data);
        audience[i].write('<=' +  getUserNameForSocket(audience[i]) + ": ");
      }
    }
    socket.write( '<=' +  getUserNameForSocket(socket) + ": ");
}


function assignUserName(socket, cleanData){
      // this is a new socket

    // is this a unique userName?
    for (var key in socketNameToUserNameMap) {

      if(socketNameToUserNameMap[key] == cleanData){
        socket.write( "<= Sorry, name taken. \r\n<= Login Name? ");
        return;
      }
    }
    
      socketNameToUserNameMap['mysocket.' + socketArray.indexOf(socket)] = cleanData;
      socket.write( "<= Welcome " + cleanData + " ! \r\n");
}











// intiializae the roomNameToAudienceSocketArrayMap on startup
(function populateDifferentChatRooms(){
  for( var i=0; i < listOfRooms.length; i++){
    roomNameToAudienceSocketArrayMap[listOfRooms[i]] = [];
  }
})();





 // Method executed when data is received from a socket
function receiveData(socket, data) {

  var cleanData = cleanInput(data);

  if(typeof  getUserNameForSocket(socket) === 'undefined'){
    assignUserName(socket, cleanData);
    return ; 
  }



  switch (cleanData){
    case "/quit":
      quit(socket);
      break;

    case "/rooms":
      getListOfRooms(socket);
      break;

    case "/join":
        joinARoom(socket, cleanData);
        break;

    case "/leave": 
      leaveARoom(socket);
      break;

    default: 
      broadcaseMessage(socket);
    }

}
 








// When socker connection ends, remove socker from the array.
function closeSocket(socket) {
  var i = socketArray.indexOf(socket);
  if (i != -1) {
    socketArray.splice(i, 1);
  }
}
 




// Callback fucnction triggered when a new connection comes.
function newSocket(socket) {
  
  // Save in socker array
  socketArray.push(socket);


  // Welcome user
  socket.write("Welcome to the Chinmay's chat  server!\n");
  socket.write('Login Name? \n');


  // bind with few actions.
  socket.on('data', function(data) {
    receiveData(socket, data);
  })

  socket.on('end', function() {
    closeSocket(socket);
  })
}
 





// Create a new server and provide a callback for when a connection occurs
var server = net.createServer(newSocket);

// Listen for response on this port
server.listen(PORT_NUMBER);









