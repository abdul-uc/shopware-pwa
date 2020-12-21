import {
  getNavigationEndpoint,
  getStoreNavigationEndpoint,
} from "../endpoints";
import { defaultInstance, ShopwareApiInstance } from "../apiService";
import {
  NavigationResponse,
  StoreNavigationElement,
} from "@shopware-pwa/commons/interfaces/models/content/navigation/Navigation";
import { SearchCriteria } from "@shopware-pwa/commons/interfaces/search/SearchCriteria";
import { convertSearchCriteria, ApiType } from "../helpers/searchConverter";

import * as idxdb from "idb"; // Type hinting idb.d.ts
import { IDBPDatabase, openDB } from "idb";
import { IndexedDb } from "../indexedDb";
/**
 * @alpha
 */
export interface GetNavigationParams {
  depth: number;
  rootNode?: string;
}

/**
 * More about the navigation parameters: https://docs.shopware.com/en/shopware-platform-dev-en/store-api-guide/navigation?category=shopware-platform-dev-en/store-api-guide
 * @beta
 */
export interface GetStoreNavigationParams {
  requestActiveId:
    | "main-navigation"
    | "service-navigation"
    | "footer-navigation";
  requestRootId: "main-navigation" | "service-navigation" | "footer-navigation";
  depth?: number;
  buildTree?: boolean;
  searchCriteria?: SearchCriteria;
}

/**
 * @throws ClientApiError
 * @alpha
 */
export async function getNavigationfromServer(
  params: GetNavigationParams,
  contextInstance: ShopwareApiInstance = defaultInstance
): Promise<NavigationResponse> {
  const resp = await contextInstance.invoke.post(
    getNavigationEndpoint(),
    params
  );
  console.log("Response test 1234:-", resp.data);
  return resp.data;
}

/* const runIndexDb = async () => {
    const indexedDb = new IndexedDb('test');
    await indexedDb.createObjectStore(['books', 'students']);
    await indexedDb.putValue('books', { name: 'A Game of Thrones' });
    await indexedDb.putBulkValue('books', [{ name: 'A Song of Fire and Ice' }, { name: 'Harry Potter and the Chamber of Secrets' }]);
    await indexedDb.getValue('books', 1);
    await indexedDb.getAllValue('books');
    await indexedDb.deleteValue('books', 1);
} */

export async function getNavigation(
  params: GetNavigationParams,
  contextInstance: ShopwareApiInstance = defaultInstance
): Promise<NavigationResponse> {

 const db = await openDB<MyDB>('my-db-1', 1, {
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
  const val = await db.get("favourite-number", 'top-navigation') || 0;
    console.log("val", val);
    if(val == 0){
     
      const resp = await contextInstance.invoke.post(
      getNavigationEndpoint(),
      params
    );
    console.log("Response from API:", resp.data);
    await db.put("favourite-number", resp.data, "top-navigation");
    // await db.put("favourite-number", "topnav", resp.data);
    // await indexedDb.putValue("navigation", resp.data);
    await db.put("favourite-number", 'nav', "test_data");
    await db.put("favourite-number", 3, "test_data");
    await db.put("favourite-number", 3, "{test_data}");
    await db.put("favourite-number", 'topnav', resp.data);
    return resp.data;
    }
    return val;
  // This fails at compile time, as the 'favourite-number' store expects a number.
  await db.put('favourite-number', 'Twelve', 'Jake');

   /*  const tableName = "navigation";
    let dbPromise: Promise<idxdb.DB> = openDB('test-db5', 1, (upgradeDb: idxdb.UpgradeDB) => {
        if (!upgradeDb.objectStoreNames.contains( tableName )) {
            let store = upgradeDb.createObjectStore( tableName , {keyPath: 'name', autoIncrement: true});
        }
    });
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

const resp = await contextInstance.invoke.post(
          getNavigationEndpoint(),
          params
        );
    dbPromise.then((db: idxdb.DB): Promise<void> => {
            let tx: idxdb.Transaction = db.transaction(tableName, 'readwrite');
            let store: idxdb.ObjectStore = tx.objectStore(tableName);

            
        console.log("Response from API:", resp.data);
            let item = {
                name: 'top-navigation', 
                data: resp.data
            };
            store.add(item);
            return tx.complete;
        }).then(() => {
            console.log(`added item to the store os!`);
        }).catch((err: Error) => {
            console.log(`Couldn\'t add item to the store os!. ${err}`);
        });
        return resp.data;
    console.log("test"); */
  const indexedDb = new IndexedDb("test");
  await indexedDb.createObjectStore(["books", "students", "navigation"]);
  await indexedDb.putValue("books", { name: "A Game of Thrones" });
  // await indexedDb.putValue("navigation", { name: "A Game of Thrones" });
  // const resp = await contextInstance.invoke.post(
  //   getNavigationEndpoint(),
  //   params
  // );
  // console.log("Response from API:", resp.data);
  // await indexedDb.putValue("navigation", resp.data);
  // const result = indexedDb.getValue("navigation", 1);
  //const store = indexedDb.openObjectStore("navigation", "readwrite");
  const result = indexedDb.getValue("navigation", 1);
  console.log("Response from DB:", result);
  console.log("Response from DB value:", result.value);
  if (result && result.length > 0) {
    console.log("Response from DB:", result);
    return result;
  } else {
    const resp = await contextInstance.invoke.post(
      getNavigationEndpoint(),
      params
    );
    console.log("Response from API:", resp.data);
    await indexedDb.putValue("navigation", resp.data);
    return resp.data;
  }
}

/**
 * @throws ClientApiError
 * @beta
 */
export async function getStoreNavigation(
  {
    requestActiveId,
    requestRootId,
    depth,
    buildTree,
    searchCriteria,
  }: GetStoreNavigationParams,
  contextInstance: ShopwareApiInstance = defaultInstance
): Promise<StoreNavigationElement[]> {
  const resp = await contextInstance.invoke.post(
    getStoreNavigationEndpoint(requestActiveId, requestRootId),
    {
      ...convertSearchCriteria({
        searchCriteria,
        apiType: ApiType.store,
        config: contextInstance.config,
      }),
      ...{
        depth,
        buildTree,
      },
    }
  );

  return resp.data;
}
