# Project Overview
This project is a waste management system designed to monitor and analyze environmental parameters and visual data in real-time. The system integrates a Raspberry Pi, ESP32 microcontroller, and various sensors for efficient data collection and processing. All collected data is transmitted to the oneM2M platform for centralized management and visualization through a user-friendly dashboard.
# Features 
###### Camera Integration (Raspberry Pi): Captures visual data for waste classification, monitoring, or operational analysis.
###### Environmental Monitoring (ESP32): Collects data from:
###### CO2 Sensor for carbon dioxide levels.
###### Methane Sensor for gas emissions from waste decomposition.
###### oneM2M Framework: Enables standardization and interoperability for seamless data exchange.
###### Data Visualization: Real-time dashboards provide insights into environmental conditions and waste management efficiency.
###### Local Display (Adafruit): Displays real-time sensor data for on-site monitoring.

# Technology Stack
### Hardware:
1) ESP32

![image](https://github.com/user-attachments/assets/7d29f5d2-70ec-4c3a-9274-2b11a2ea8d40)

2) Methane Gas Sensor 
         
![image](https://github.com/user-attachments/assets/6bc26af5-2a98-427f-a756-6099c68f7075)

3) CO2 Sensor

![image](https://github.com/user-attachments/assets/e1254b81-6005-48eb-819b-6881db314a35)

4) Adafruit Display

![image_62-removebg-preview](https://github.com/user-attachments/assets/d571ede7-5115-4583-86ba-aa68bd73a838)

### Software
1) Arduino IDE

# Installation and Setup
### Prerequisites
1) ESP32 microcontroller programmed to interface with CO2 and methane sensors.
    ## CO2 to ESP32 Pin Connections

| **CO2**       | **ESP32 Pins** |
|---------------|----------------|
| CO2_VCC       | 5V             |
| CO2_GND       | GND            |
| CO2_PWM       | 13             |


 ## MQ2 Sensor to ESP32 Pin Connections

| **MQ2**       | **ESP32 Pins** |
|---------------|----------------|
| MQ2_VCC       | 5V             |
| MQ2_GND       | GND            |
| MQ2_NC        | Not Connected  |
| MQ2_SIG       | 34             |


2) Adafruit Display connected to ESP32 with the below given conection.

    ## OLED to ESP32 Pin Connections

| **OLED**      | **ESP32 Pins** |
|---------------|----------------|
| OLED_MOSI     | 23             |
| OLED_CLK      | 18             |
| OLED_DC       | 16             |
| OLED_CS       | 5              |
| OLED_RS       | 4              |
| OLED_GND      | GND            |
| OLED_VCC      | VIN            |

4) Database and oneM2M platform configured and running.
5) Arduino IDE (v 2.3.2) need to be installed
6) All the below library need to be installed
    ###### WiFi.h
    ###### Adafruit_GFX.h
    ###### Adafruit_SH110X.h
    ###### SPI.h
# Hardware Connection Diagram

![HArdware_Diagram_v2](https://github.com/user-attachments/assets/17489961-a27d-4157-b930-8883667e651a)


