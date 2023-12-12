import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import * as Notifications from "expo-notifications";
import { useEffect, useState } from "react";
import {
  Text,
  View,
  StyleSheet,
  Permission,
  PermissionsAndroid,
} from "react-native";
import { Button } from "react-native";

const YOUR_TASK_NAME = "geofencing-task";

// set notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// set android channel
Notifications.setNotificationChannelAsync("default", {
  name: "default",
  importance: Notifications.AndroidImportance.MAX,
  vibrationPattern: [0, 250, 250, 250],
  lightColor: "#FF231F7C",
});

// define task for geofencing
TaskManager.defineTask(
  YOUR_TASK_NAME,
  ({ data: { eventType, region }, error }) => {
    if (error) {
      console.warn(error);
      return;
    }
    if (eventType === Location.GeofencingEventType.Enter) {
      console.log("You've entered region:", region);
      sendNotification(region.identifier, "You've entered region");
    } else if (eventType === Location.GeofencingEventType.Exit) {
      console.log("You've left region:", region);
      sendNotification(region.identifier, "You've left region");
    }
  }
);

// send notification
const sendNotification = async (title, text) => {
  Notifications.scheduleNotificationAsync({
    content: {
      title: title,
      body: text,
    },
    trigger: {
      seconds: 1,
    },
  });
};

export default function App() {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const requestPermissions = async () => {
    // Request gps permissions
    let { status } = await Location.requestForegroundPermissionsAsync();
    console.log("STATUS", status);
    if (status === "denied") {
      setErrorMsg("Permission to access location was denied");
      alert("Permission to access location was denied", { status });
      return false;
    }

    // Requests notification permissions
    const { status: status3 } = await Notifications.requestPermissionsAsync();
    if (status3 !== "granted") {
      setErrorMsg("Permission to send Notifications was denied");
      return false;
    }

    return true;
  };

  useEffect(() => {
    (async () => {
      const permissions = await requestPermissions();
      if (!permissions) return;

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);

      console.log("LOCATION", location);

      const isRunning = await Location.hasStartedGeofencingAsync(
        YOUR_TASK_NAME
      );

      // Remove regions
      if (isRunning) await Location.stopGeofencingAsync(YOUR_TASK_NAME);

      // Remove other tasks
      const res = await TaskManager.getRegisteredTasksAsync();
      if (!!res && res.length > 0) {
        for (let i = 0; i < res.length; i++) {
          if (res[i].taskType === "geofencing") {
            console.log("REMOVING TASK", res[i].taskName);
            await TaskManager.unregisterTaskAsync(res[i].taskName);
          }
        }
      } else console.log("NO TASKS TO REMOVE");

      // Add regions
      const regions = [];
      regions.push({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        radius: 500,
        notifyOnEnter: true,
        notifyOnExit: true,
        identifier: "ME",
      });

      regions.push({
        latitude: 43.766667,
        longitude: 11.25,
        radius: 300,
        notifyOnEnter: true,
        notifyOnExit: true,
        identifier: "SMN",
      });

      regions.push({
        latitude: 43.8002572,
        longitude: 11.2453947,
        radius: 50,
        notifyOnEnter: true,
        notifyOnExit: true,
        identifier: "AUD-B",
      });

      regions.push({
        latitude: 43.770828,
        longitude: 11.25032,
        radius: 100,
        notifyOnEnter: true,
        notifyOnExit: true,
        identifier: "NIC",
      });

      regions.push({
        latitude: 43.78376,
        longitude: 11.27857,
        radius: 100,
        notifyOnEnter: true,
        notifyOnExit: true,
        identifier: "LEOPOLDO",
      });

      await Location.startGeofencingAsync(YOUR_TASK_NAME, [...regions]);

      console.log("STARTED GEOFENCING");
    })();
  }, []);

  let text = "Waiting..";
  if (errorMsg) {
    text = errorMsg;
  } else if (location) {
    text = JSON.stringify(location);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.paragraph}>{text}</Text>

      <Button
        title="request permissions"
        onPress={async () => {
          await requestPermissions();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  paragraph: {
    fontSize: 18,
    textAlign: "center",
  },
});
