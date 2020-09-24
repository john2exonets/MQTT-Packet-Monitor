//
//  MqttMon.js  --  Show MQTT packets going through Broker
//
//  John D. Allen
//  March 2016
//--------------------------------------------------------------------------

var VERSION = "0.1.2";
var REDISP = 20000;        // Nbr. of ms to redo display

var mqtt = require('mqtt');
var config = require('./MqttMon_config.json');
var ansi = require('./ansi.js');
var keypress = require('keypress');
var protos = require('./prototypes.js');

var DEBUG = config.debug;

//  MQTT packet data store
var tpc = [];       // topic
var payl = [];      // payload
var ts = [];        // Timestamp
var lns = [];       // payload lines

var ignoreList = [
  "homeassistant/"
];

// MQTT connection options
var copts = {
  keepalive: 20000
};

var rows = process.stdout.rows;
var colms = process.stdout.columns;
if (colms < 141) {
  console.log("ERROR! Terminal needs to be at least 140 Columns wide.");
  process.exit(1);
}

//---------------------------------------------------------------------------
//  MQTT Code
//  -- Tap into the PubSub bus and collect all current topic messages
//---------------------------------------------------------------------------
var client = mqtt.connect(config.mqtt_broker, copts);

client.on("connect", function() {
  client.subscribe('#');
});

client.on('message', function(topic, message) {
  var out = topic + ": " + message.toString();
  if (DEBUG > 8) { console.log(out); }

  // check if on ignore list
  if (ignoreList.contains(topic)) {
    if (DEBUG > 8) { console.log("Topic on Ignore List:" + topic); }
    return false;
  }

  // Check for bad data
  if (message.indexOf("nan") > 0) {
    if (DEBUG > 8) { console.log(">> BAD DATA"); }
    return false;
  }
  //  Look for existing record & update if found; else add new record.
  var ptr = tpc.indexOf(topic);
  if(ptr == -1) {
    if (DEBUG > 8) { console.log(">>New"); }
    tpc.push(topic);
    payl.push(message);
    lns.push(payloadLines(message));
    ts.push(Date.now());
  } else {
    if (DEBUG > 8) { console.log("---Existing"); }
    payl[ptr] = message;
    ts[ptr] = Date.now();
  }
  if (DEBUG > 8) { console.log("---[" + tpc.length.toString() + "|" + payl.length.toString() + "]"); }

});

function payloadLines(m) {
  var l = m.length;
  var lll;
  if (l <= 60) {   // how many lines does the payload need to print out?
    return 1;
  } else if (l <= 120 ) {   // first two lines are 60 chars long...
    return 2;
  } else {          // the rest are 80 chars long.
    l -= 120;
    lll = parseInt(l / 80) + ((l % 80 == 0) ? 0 : 1) + 2;
    if (lll > 8) {
      return 8;
    } else {
      return lll;
    }
  }
}

//---------------------------------------------------------------------------
//---------------[   Display Functions   ]-----------------------------------
//---------------------------------------------------------------------------
var printTO;
var nextstart = -1;
var pgstack = [];
pgstack.push(0);        // first page starting record
var pgdnEnable = false;
var pgupEnable = false;

//---------------------------------------------------------------------------
// Setup keypress actions
//---------------------------------------------------------------------------
// make `process.stdin` begin emitting "keypress" events
keypress(process.stdin);

// listen for the "keypress" event
process.stdin.on('keypress', function (ch, key) {
  // console.log('ch: ', ch);
  // console.log('got "keypress"', key);
  if (key && key.ctrl && key.name == 'c') {
    //process.stdin.pause();
    endProgram();
  }
  if (key && key.name == 'q') {
    endProgram();
  }

  if (key && key.name == 'pagedown' && pgdnEnable) {
    clearTimeout(printTO);
    if (pgstack.peek() != nextstart) {  // not on the last page...
      pgstack.push(nextstart);
    }
    printList(nextstart);
  }

  if (key && key.name == 'pageup' && pgupEnable) {
    clearTimeout(printTO);
    pgstack.pop();
    nextstart = pgstack.pop();
    if (nextstart == undefined) {
      pgstack.push(0);
      printList(0);
    } else {
      pgstack.push(nextstart);
      printList(nextstart);
    }
  }
});

function flgMore() {
  ansi.moveTo(rows-1,20);
  ansi.rev();
  ansi.write("More(PgDn)");
  ansi.normal();
  pgdnEnable = true;
}

function flgLess() {
  ansi.moveTo(rows-1,35);
  ansi.rev()
  ansi.write("Less(PgUp)");
  ansi.normal();
  pgupEnable = true;
}

//---------------------------------------------------------------------------
// Function: endProgram()
//---------------------------------------------------------------------------
function endProgram() {
  client.unsubscribe('#');
  client.end();
  ansi.moveTo(rows,1);
  process.exit();
}

//---------------------------------------------------------------------------
// Function: prtHeadFoot()
//---------------------------------------------------------------------------
function prtHeadFoot() {
  rows = process.stdout.rows;
  colms = process.stdout.columns;
  ansi.clear();
  ansi.moveTo(1,1);
  ansi.rev();
  ansi.write("   MQTT Packet Monitor".spacePad(139));

  ansi.moveTo(rows-1,1);
  ansi.write(" >> q to Quit ".spacePad(139));
  if (pgdnEnable) {
    ansi.moveTo(rows-1,20);
    ansi.write("More(PgDn)");
  }
  if (pgupEnable) {
    ansi.moveTo(rows-1,35);
    ansi.write("Less(PgUp)");
  }
  ansi.moveTo(rows-1, 50);
  ansi.write("Rows: " + tpc.length.toString());
  ansi.normal();

  // ansi.moveTo(rows-1,60);
  // ansi.write("nextstart=" + nextstart.toString() + " laststart=" + laststart.toString());
}

//---------------------------------------------------------------------------
// Function: printList()  --  Display all the captured MQTT Packets
//---------------------------------------------------------------------------
function printList(start) {
  var out = "";
  var ilen = tpc.length;
  var sp = (start * -1) + 3;
  var lastrec = start + (rows - 6);
  laststart = start;
  if (start === 0) {
    pgstack = [0];          // reset page stack
  }

  // Adjust lastrec for multi-row payloads
  for (var j = start; j <= lastrec; j++) {
    lastrec -= lns[j] - 1;
    if (j == lastrec) {
      if (lastrec < start) {      // if payload is so large it won't fit the screen, at least print what you can!
        lastrec = start;
      }
    }
  }

  prtHeadFoot();
  if (DEBUG > 5) {
    ansi.moveTo(rows,5);
    ansi.write("STACK>[ " + pgstack.toString() + " ]");
    ansi.moveTo(rows, 40);
    ansi.write("lastrec = " + lastrec);
  }
  // ansi.moveTo(rows-1, 90);
  // ansi.write("scrRows:" + rows.toString() + " start:" + start.toString() + " lastrec:" + lastrec.toString() + " nextstart:" + nextstart.toString());

  for(var i = start; i < tpc.length; i++) {
    if (tpc.length == 0) { break; }     // In case this is called befor any MQTT messages have arrived.
//  tpc.forEach(function(v,i) {
    ansi.moveTo(i+sp,1);
    ansi.write((i+1).toString());
    // topic
    ansi.moveTo(i+sp,5);
    ansi.write(tpc[i]);
    // date
    ansi.moveTo(i+sp,115);
    //ansi.write(new Date(ts[i]).toISOString().replace(/T/,' ').replace(/\..+/,''));
    ansi.write(new Date(ts[i]).toString().replace(/\GMT.+/,''));
    // payload
    ansi.moveTo(i+sp, 50);
    ansi.write(payl[i].slice(0,60));      // line 1
    // payload lines
    // ansi.moveTo(i+sp, 45);
    // ansi.write(lns[i].toString());

    //ansi.write(payl[i].length)
    if (payl[i].length > 60) {    // line 2
      sp++;
      ansi.moveTo(i+sp, 50);
      ansi.write(payl[i].slice(60,120));
      ansi.moveTo(i+sp, 45);
      ansi.write(payl[i].length.toString());
      if (payl[i].length > 120) {   // line 3
        sp++;
        ansi.moveTo(i+sp, 50);
        ansi.write(payl[i].slice(120,200));
        if (payl[i].length > 200) {   // line 4
          sp++;
          ansi.moveTo(i+sp, 50);
          ansi.write(payl[i].slice(200,280));
          if (payl[i].length > 280) {   // line 5
            sp++;
            ansi.moveTo(i+sp,50);
            ansi.write(payl[i].slice(280,360));
            if (payl[i].length > 360) {   // line 6
              sp++;
              ansi.moveTo(i+sp,50);
              ansi.write(payl[i].slice(360,440));
              if (payl[i].length > 440) {   // line 7
                sp++;
                ansi.moveTo(i+sp,50);
                ansi.write(payl[i].slice(440,520));
                if (payl[i].length > 520) {   // line 8
                  sp++;
                  ansi.moveTo(i+sp,50);
                  ansi.write(payl[i].slice(520,600));
                }
              }
            }
          }
        }
      }
    }
    if (i == lastrec) {
      nextstart = i +1;
      flgMore();
      flgLess();
      break;
    }
  }

  printTO = setTimeout(printList, REDISP, 0);     // Every 20 seconds
}

function sorttpc() {
  var list = [];
  for (var j = 0; j < tpc.length; j++) {
    list.push({'topic': tpc[j], 'payl': payl[j], 'ts': ts[j], 'ln': lns[j] });
  }
  list.sort((a,b) => {
    return ((a.topic < b.topic) ? -1 : ((a.topic == b.name) ? 0 : 1));
  });
  for (var k = 0; k < list.length; k++) {
    tpc[k] = list[k].topic;
    payl[k] = list[k].payl;
    ts[k] = list[k].ts;
    lns[k] = list[k].ln;
  }
  sortTO = setTimeout(sorttpc, REDISP+10000);
}


//---------------------------------------------------------------------------
//-------------------------------[   MAIN   ]--------------------------------
//---------------------------------------------------------------------------

printList(0);
var sortTO = setTimeout(sorttpc, 60000);  // sort array after 60 seconds.
process.stdin.setRawMode(true);
process.stdin.resume();
