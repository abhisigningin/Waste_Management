#ifndef CTOP_SEND_H
#define CTOP_SEND_H

#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <WiFi.h>
#define postled 10

void postData(int Methane, int CO2) {
    if (WiFi.status() == WL_CONNECTED) {
        HTTPClient http;

        // Update the URL to point to your API endpoint
          http.begin("https://ctop.iiit.ac.in/api/cin/create/69");
        http.addHeader("Content-Type", "application/json");
        http.addHeader("Authorization", "Bearer c7941a704b44446b9e57a8716e0eecaf");

        // Create a JSON document to store the data
        DynamicJsonDocument jsonDoc(1024);
        jsonDoc["Methane"] = Methane;
        jsonDoc["CO2"] = CO2;
        
        // Serialize JSON to a string
        String requestBody;
        serializeJson(jsonDoc, requestBody);

        // Send the POST request
        int httpResponseCode = http.POST(requestBody);

        // Check the response from the server
        if (httpResponseCode == 200) {  // Success
            String response = http.getString();
            Serial.println(httpResponseCode);
            Serial.println(response);

            // Blink the LED to indicate success
            digitalWrite(postled, HIGH); 
            delay(500);  // LED on for 500ms
            digitalWrite(postled, LOW);  
        } else {
            Serial.print("Error on sending POST: ");
            Serial.println(httpResponseCode);
        }

        http.end();  // End the HTTP connection
    } else {
        Serial.println("WiFi not connected. Cannot send data.");
    }
}

#endif // CTOP_SEND_H