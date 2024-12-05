#include <WiFi.h>
#include "ctop.h"

#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SH110X.h>
#include <SPI.h>

#define OLED_MOSI   23 // Data
#define OLED_CLK    18 // Clock
#define OLED_DC     16 // Data/Command
#define OLED_CS     5  // Chip Select
#define OLED_RST  4  // Reset



// Create the OLED display
Adafruit_SH1106G display = Adafruit_SH1106G(128, 64,OLED_MOSI, OLED_CLK, OLED_DC, OLED_RST, OLED_CS);


#define NUMFLAKES 10
#define XPOS 0
#define YPOS 1
#define DELTAY 2


#define LOGO16_GLCD_HEIGHT 16
#define LOGO16_GLCD_WIDTH  16
static const unsigned char PROGMEM logo16_glcd_bmp[] =
{ B00000000, B11000000,
  B00000001, B11000000,
  B00000001, B11000000,
  B00000011, B11100000,
  B11110011, B11100000,
  B11111110, B11111000,
  B01111110, B11111111,
  B00110011, B10011111,
  B00011111, B11111100,
  B00001101, B01110000,
  B00011011, B10100000,
  B00111111, B11100000,
  B00111111, B11110000,
  B01111100, B11110000,
  B01110000, B01110000,
  B00000000, B00110000
};

// CO2 Sensor Configuration
const int CO2_PIN = 13;                   // GPIO pin for CO2 sensor
#define SENSOR_PIN 34                     // Replace with the GPIO pin connected to the sensor

// Define constants based on the sensor's datasheet
#define sensorpin 34
#define R0 6.85

unsigned long duration, th, tl;           // Timing variables for CO2 reading
int ppm; 
int methane_ppm;

const char* ssid = "RUT_D8B8_2G";
const char* password = "Ec72Qsp4";

// Function to monitor CO2 levels
void CO2_Monitor() 
{
    th = pulseIn(CO2_PIN, HIGH, 2008000) / 1000;
    tl = 1004 - th;
    ppm = 2000 * (th - 2) / (th + tl - 4);
    Serial.print("CO2 Concentration: ");
    Serial.println(ppm);
}

void oled_display()
{
  
   // Start OLED
  display.begin(0, true); // Reset OLED display
  display.display();
  delay(1000);
  display.clearDisplay();
  display.setTextSize(2); // Set the text size
  display.setTextColor(SH110X_WHITE); // Set text color to white
  display.setCursor(0,0); // Set the text cursor position
  display.println("Smart City"); // Print the name
  display.display();
  display.setTextSize(1); // Set the text size
  display.setTextColor(SH110X_WHITE); // Set text color to white
  display.setCursor(30,20); // Set the text cursor position
  display.println("Living Lab"); // Print the name
  display.display();
  delay(5000);
  display.clearDisplay();
  display.setTextSize(2); // Set the text size
  display.setTextColor(SH110X_WHITE); // Set text color to white
  display.setCursor(0,0); // Set the text cursor position
  display.print("CO2 = "); // Print the name
  display.print(ppm);
  display.display(); // Update the display
  display.setTextSize(2); // Set the text size
  display.setTextColor(SH110X_WHITE); // Set text color to white
  display.setCursor(1,20); // Set the text cursor position
  display.print("CH4 = "); // Print the name
  display.print(methane_ppm);
  display.display(); // Update the display
  delay(2000); // Optional delay for visibility
  
}
void GAS_Monitor()
{
    float sensor_volt;
    float RS_gas; // Value of RS in a GAS
    float ratio; // Ratio RS_GAS/RS_air
    

    int sensorValue = analogRead(sensorpin);
    sensor_volt = (float)sensorValue / 4096 * 3.3;
    RS_gas = (3.3 - sensor_volt) / sensor_volt; // omit * RL
    ratio = RS_gas / R0;  // RS/R0

    // Calculate methane concentration in PPM
    float m = -1.58; // Slope from the datasheet curve
    float b = 3;     // Intercept from the datasheet curve
    methane_ppm = pow(10, (m * log10(ratio) + b));

    // Display values
    Serial.print("sensor_volt = ");
    Serial.println(sensor_volt);
    Serial.print("RS_ratio = ");
    Serial.println(RS_gas);
    Serial.print("Rs/R0 = ");
    Serial.println(ratio);
    Serial.print("Methane PPM = ");
    Serial.println(methane_ppm);

    Serial.print("\n\n");

    delay(1000);
}

void setup()
{
    Serial.begin(115200); // Higher baud rate for ESP32
    pinMode(CO2_PIN, INPUT); // Set CO2 sensor pin as input      
    analogReadResolution(12); // Set ADC resolution to 12 bits (0-4095)

    WiFi.begin(ssid, password);
    Serial.println("\nConnecting");

    while(WiFi.status() != WL_CONNECTED){
        Serial.print(".");
        delay(500);
    }

    Serial.println("\nConnected to the WiFi network");
    Serial.print("Local ESP32 IP: ");
    Serial.println(WiFi.localIP());
    delay(1000); 
    

  // Start OLED
  display.begin(0, true); // we dont use the i2c address but we will reset!

  display.display();
  delay(2000);

  // Clear the buffer.
  display.clearDisplay();

  // draw a single pixel
  display.drawPixel(10, 10, SH110X_WHITE);
  
  display.display();
  delay(2000);
  display.clearDisplay();   
}    


void loop() {
 
  CO2_Monitor();      // Read CO2 concentration
  GAS_Monitor();
  postData(methane_ppm,ppm);
  oled_display();
  delay(2000);             // Delay for system stability
  while (WiFi.status() != WL_CONNECTED){
        Serial.print(".");
        Serial.println("\nConnected to the WiFi network");
        Serial.print("Local ESP32 IP: ");
        Serial.println(WiFi.localIP());
        delay(100);
    }

}