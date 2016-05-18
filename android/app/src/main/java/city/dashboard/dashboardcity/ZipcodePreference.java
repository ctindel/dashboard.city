package city.dashboard.dashboardcity;

import android.app.Activity;
import android.content.SharedPreferences;

public class ZipcodePreference {
    SharedPreferences prefs;

    public ZipcodePreference(Activity activity){
        prefs = activity.getPreferences(Activity.MODE_PRIVATE);
    }

    // If the user has not chosen a city yet, return
    // 10022 as the default
    String getZipcode(){
        return prefs.getString("zip", "10022");
    }

    void setZipcode(String zip){
        prefs.edit().putString("zip", zip).commit();
    }
}
