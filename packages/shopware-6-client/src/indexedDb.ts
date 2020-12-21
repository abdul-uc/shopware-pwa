import { IDBPDatabase, openDB } from "idb";

interface MyDB extends DBSchema {
  'favourite-number': {
    key: string;
    value: string;
  };
  products: {
    value: {
      name: string;
      price: number;
      productCode: string;
    };
    key: string;
    indexes: { 'by-price': number };
  };
}

export class IndexedDb {
  private database: string;
  private db: any;

  constructor(database: string) {
    this.database = database;
  }

  public async createObjectStore(tableNames: string[]) {
    try {
      this.db = await openDB(this.database, 1, {
        upgrade(db: IDBPDatabase) {
          for (const tableName of tableNames) {
            if (db.objectStoreNames.contains(tableName)) {
              continue;
            }
            db.createObjectStore(tableName, {
              autoIncrement: true,
              keyPath: "id",
            });
          }
        },
      });
    } catch (error) {
      return false;
    }
  }

  public async openObjectStore(name: string, transactionMode: string) {
    return this.db.transaction(name, transactionMode).objectStore(name);
  }

  public async getValue(tableName: string, id: number) {
    
    const db = await openDB<MyDB>('my-db', 1, {
    upgrade(db) {
      db.createObjectStore('favourite-number');

      const productStore = db.createObjectStore('products', {
        keyPath: 'productCode',
      });
      productStore.createIndex('by-price', 'price');
    },
  });

  // This works
  await db.put('favourite-number', 7, 'Jen');
  const val = await db.get("favourite-number", 8) || 0;
    console.log("val", val);
    if(val == 0){
      await db.put("favourite-number", 8, "ABD");
    }
  // This fails at compile time, as the 'favourite-number' store expects a number.
  await db.put('favourite-number', 'Twelve', 'Jake');

    let dbPromise: Promise<idxdb.DB> = openDB('test-db5', 1, (upgradeDb: idxdb.UpgradeDB) => {
        if (!upgradeDb.objectStoreNames.contains( tableName )) {
            let store = upgradeDb.createObjectStore( tableName , {keyPath: 'name', autoIncrement: true});
        }
    });
    console.log('DB:', dbPromise);
    
    // Reads an item from our database
    dbPromise.then((db: idxdb.DB) => {
        let tx: idxdb.Transaction = db.transaction( tableName , 'readonly');
        let store: idxdb.ObjectStore = tx.objectStore( tableName );
        return store.get('top-navigation');
    }).then((item: Object) => {
        console.log('The item from our database is:');
        console.dir(item);
        return item.data;
    }).catch((err: Error) => {
        console.log(`Couldn\'t fetch top navigation from the store navigation!. ${err}`);
        // Add an item to our database
    });
    const data = [];
    /* const tx = this.db.transaction(tableName, "readonly");
    if (tx) {
      const store = tx.objectStore(tableName);
      var req = store.openCursor(id);
      req.onsuccess = function (e) {
        var cursor = e.target.result;
        if (cursor) {
          // key already exist
          console.log("Get Data ", JSON.stringify(cursor));
          data.push(cursor.value);
          cursor.continue();
        } else {
           console.log("Get Data Else: ", e);
          // key not exist
        }
      }; */
      /* const result = await store.get(id);
      console.log("Get Data ", JSON.stringify(result));
      return result; */
      console.log("Get Data ", data);
      return data;
    // }
  }

  public async getAllValue(tableName: string) {
    const tx = this.db.transaction(tableName, "readonly");
    const store = tx.objectStore(tableName);
    const result = await store.getAll();
    console.log("Get All Data", JSON.stringify(result));
    return result;
  }

  public async putValue(tableName: string, value: object) {
    const tx = this.db.transaction(tableName, "readwrite");
    const store = tx.objectStore(tableName);
    const result = await store.put(value);
    console.log("Put Data ", JSON.stringify(result));
    return result;
  }

  public async putBulkValue(tableName: string, values: object[]) {
    const tx = this.db.transaction(tableName, "readwrite");
    const store = tx.objectStore(tableName);
    for (const value of values) {
      const result = await store.put(value);
      console.log("Put Bulk Data ", JSON.stringify(result));
    }
    return this.getAllValue(tableName);
  }

  public async deleteValue(tableName: string, id: number) {
    const tx = this.db.transaction(tableName, "readwrite");
    const store = tx.objectStore(tableName);
    const result = await store.get(id);
    if (!result) {
      console.log("Id not found", id);
      return result;
    }
    await store.delete(id);
    console.log("Deleted Data", id);
    return id;
  }
}

// export const IndexedDb;
