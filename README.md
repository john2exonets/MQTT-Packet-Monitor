# MQTT-Packet-Monitor
Displays all Packets published by an MQTT Broker in an ANSI Terminal.

(MqttMon Screenshot)[MQTT_Packet-Monitor.PNG]<br>

This is a very simple looking MQTT Packet monitor that will show every MQTT packet being Published by an MQTT Broker. It requires the use of a terminal screen that supports ANSI contorl
characters in order to work. Packet Topic and Payloads are displayed, along with a timestamp of when it was received. Payloads up to 600 bytes are printed, and the rest is dropped. 
There is a 'Ignorelist' array in the code to not show specific MQTT packets based on the Topic.

