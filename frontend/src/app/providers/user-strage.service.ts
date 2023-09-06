import { Injectable } from '@angular/core';
import { Storage } from "@ionic/storage-angular";
import * as constant from "../models/user-strage-constants";

@Injectable({
  providedIn: 'root'
})
export class UserStrageService {

  constructor(
    public storage: Storage
  ) { }

  // TODO If you need to store operational information, store it in WebStorage.
  setNetworkId(key: string | undefined): Promise<any> {
    return this.storage.set(constant.STRAGEKEY_CURRENT_NETWORK_ID, key);
  }
  async getNetworkId(): Promise<string> {
    return this.storage
      .get(constant.STRAGEKEY_CURRENT_NETWORK_ID)
      .then((value) => {
        return value;
      });
  }

}
