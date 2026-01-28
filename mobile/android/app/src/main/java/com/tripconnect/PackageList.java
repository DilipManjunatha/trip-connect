package com.tripconnect;

import android.app.Application;
import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;
import java.util.ArrayList;
import java.util.List;

public class PackageList {
  private Application application;

  public PackageList(Application application) {
    this.application = application;
  }

  public List<ReactPackage> getPackages() {
    return new ArrayList<>();
  }
}
