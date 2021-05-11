import { getStoreNavigationEndpoint } from "../endpoints";
import { defaultInstance, ShopwareApiInstance } from "../apiService";
import {
  StoreNavigationElement,
  StoreNavigationType,
} from "@shopware-pwa/commons/interfaces/models/content/navigation/Navigation";
import { SearchCriteria } from "@shopware-pwa/commons/interfaces/search/SearchCriteria";
import { convertSearchCriteria, ApiType } from "../helpers/searchConverter";

import * as idxdb from "idb"; // Type hinting idb.d.ts
import { IDBPDatabase, openDB } from "idb";
import { indexDB } from "../indexDB";
import { getPageResolverEndpoint } from "../endpoints";
import {
  ShopwareSearchParams,
} from "@shopware-pwa/commons/interfaces/search/SearchCriteria";
import { getDefaultApiParams } from "@shopware-pwa/composables";
import { stringify } from 'zipson';
import { parse } from 'zipson';

// import { exportToJson } from '../idb-backup-and-restore.mjs';
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
  requestActiveId: StoreNavigationType;
  requestRootId: StoreNavigationType;
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

export interface Detail {
  urlPattern: string;
  handler: string;
  method: string;
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

export interface Path {
  path: any[];
}
export function get_path(children: any, path_array: Path) {
  const path = children.route.path;
  // console.log("path", path);
  path_array.path.push(path);
  if (children.children?.length > 0) {
    // console.log("children.children", children.children);
    for (let child of children.children) {
      const path = child.route.path;
      // console.log("path", path);
      path_array.path.push(path);
      if (child.children?.length > 0) {
        get_path(child, path_array);
      }
    }
  }
  //console.log("Path Array:", path_array);
}

export async function saveProducts_OLD(
  response: NavigationResponse,
  contextInstance: ShopwareApiInstance = defaultInstance
): Promise<void> {

  console.log("Inside Save Products", response);
  const db = await openDB<MyDB>('my-db-1', 1, {
    upgrade(db) {
      db.createObjectStore('favourite-number');

      const productStore = db.createObjectStore('products', {
        keyPath: 'id', autoIncrement: true
      });
      productStore.createIndex('by-price', 'price');
      productStore.createIndex('by-path', 'path', { multiEntry: true });
      productStore.createIndex('by-detail-path', 'detail_path');
    },
  });
  let params: ShopwareSearchParams = {
    limit: 500
  };
  console.log("Response Children:", response.children);
  let path_array = {} as Path;
  path_array.path = [];
  get_path(response, path_array);
  console.log("Path Array:", path_array);

  var unique = path_array.path.filter(function (elem, index, self) {
    return index === self.indexOf(elem);
  });

  console.log("Unique Path Array:", unique);
  await db.put("favourite-number", unique, "unique-path-array");


  let array_elements_media = [];
  let array_detail_view = [];
  let count = 0;
  //unique = ["/", "Earrings/"];
  for (let path of unique) {
    console.log("PATH:", path);

    const all_products = await contextInstance.invoke.post(getPageResolverEndpoint(), {
      path: path.toString(),
      ...params,
    }, { timeout: 300000 });

    const val = await db.get("favourite-number", 'page_response_place_holder') || 0;
    console.log("val", val);
    if (val == 0) {
      const response_place_holder = all_products.data;
      //response_place_holder.cmsPage.sections[0].blocks[2].slots[0].data.listing.elements = [];
      await db.put("favourite-number", response_place_holder, "page_response_place_holder");
    }
    let elements = all_products.data.cmsPage.sections[0].blocks[2].slots[0].data.listing.elements;

    let detail_params: ShopwareSearchParams = {
      limit: 10
    };

    let detail_params_default = getDefaultApiParams();
    console.log("DETAIL PARAMS DEFAULT: ", detail_params_default);
    for (let element of elements) {
      console.log(element); // 1, "string", false
      if (element.translated.customFields.migration_BerndWolf_product_attr13 && element.translated.customFields.migration_BerndWolf_product_attr13.startsWith("K")) {
        //console.log("Offline Elemeent - begin:", element);
        if (element.cover && element.cover.media) {
          array_elements_media.push(element.cover.media.url);
          for (let thumbnail of element.cover.media.thumbnails) {
            thumbnail.url = element.cover.media.url;
            //  array_elements_media.push(thumbnail.url);
          }
          const val = await db.get('products', element.id) || 0;
          console.log("product_exist", val);
          let commentData = {} as Detail;
          commentData.handler = "CacheFirst";
          commentData.method = 'GET';
          let detail_path = "";
          if (element.seoUrls && element.seoUrls.length > 0) {
            commentData.urlPattern = process.env.HOST + ":" + process.env.PORT + "/" + element.seoUrls[0].seoPathInfo;
            array_detail_view.push("http://localhost:3000/" + element.seoUrls[0].seoPathInfo);
            detail_path = element.seoUrls[0].seoPathInfo;
          } else {
            commentData.urlPattern = process.env.HOST + ":" + process.env.PORT + "/detail/" + element.id;
            array_detail_view.push("http://localhost:3000/detail/" + element.id);
            detail_path = "detail/" + element.id;
          }
          if (val == 0) {
            const resp = await contextInstance.invoke.post(getPageResolverEndpoint(), {
              path: detail_path,
              ...detail_params_default.useCms,
            }, { timeout: 300000 });
            console.log("Product Page Response:", resp.data);
            let detail_page = resp.data;
            //console.log("Offline Elemeent end:", element);
            const result = await db.put('products', {
              id: element.id,
              path: path.split(","),
              name: element.translated?.name,
              detail_path: detail_path,
              detail_page: detail_page,
              price: element.calculatedPrices[0]?.unitPrice,
              productCode: element.translated?.customFields?.migration_BerndWolf_product_attr13,
              element: element
            });
            //console.log('Put Data: ', JSON.stringify(result));
            count += 1;
          } else {
            let new_path = val.path;
            new_path.push(path);
            const result = await db.put('products', {
              id: element.id,
              path: new_path,
              detail_path: detail_path,
              detail_page: val.detail_page,
              name: element.translated?.name,
              price: element.calculatedPrices[0]?.unitPrice,
              productCode: element.translated?.customFields?.migration_BerndWolf_product_attr13,
              element: element
            });
          }
          // array_detail_view.push(commentData);
        }
      }
    }
  }
  console.log("COUNT of products with K:", count);
  var elements_media = array_elements_media.join("','");
  console.log("MEDIA ENDPOINTS:", elements_media);
  var detail_view = array_detail_view.join("','");
  //console.table(array_detail_view);
  console.log(detail_view);
  /* const val = await db.get("favourite-number", 'page_response_place_holder') || 0;
  console.log("val", val);
  if (val == 0) {
    const response_place_holder = all_products.data;
    //response_place_holder.cmsPage.sections[0].blocks[2].slots[0].data.listing.elements = [];
    await db.put("favourite-number", response_place_holder, "page_response_place_holder");
  } */
}
export async function saveProducts(
  response: NavigationResponse,
  contextInstance: ShopwareApiInstance = defaultInstance
): Promise<void> {

  console.log("Inside Save Products", response);
  const db = await openDB<MyDB>('my-db-1', 1, {
    upgrade(db) {
      db.createObjectStore('favourite-number');

      const productStore = db.createObjectStore('products', {
        keyPath: 'id', autoIncrement: true
      });
      productStore.createIndex('by-price', 'price');
      productStore.createIndex('by-path', 'path', { multiEntry: true });
      productStore.createIndex('by-detail-path', 'detail_path');
    },
  });
  let params: ShopwareSearchParams = {
    limit: 10
  };
  console.log("Response Children:", response.children);
  let path_array = {} as Path;
  path_array.path = [];
  get_path(response, path_array);
  console.log("Path Array:", path_array);

  var unique = path_array.path.filter(function (elem, index, self) {
    return index === self.indexOf(elem);
  });

  console.log("Unique Path Array:", unique);
  await db.put("favourite-number", unique, "unique-path-array");

  unique = ["/"];
  for (let path of unique) {
    console.log("PATH:", path);

    const all_products = await contextInstance.invoke.post(getPageResolverEndpoint(), {
      path: path.toString(),
      ...params,
    }, { timeout: 300000 });

    const val = await db.get("favourite-number", 'page_response_place_holder') || 0;
    console.log("val", val);
    if (val == 0) {
      const response_place_holder = all_products.data;
      //response_place_holder.cmsPage.sections[0].blocks[2].slots[0].data.listing.elements = [];
      await db.put("favourite-number", response_place_holder, "page_response_place_holder");
    }
  }
  let detail_params_default = getDefaultApiParams();
  console.log("DETAIL PARAMS DEFAULT: ", detail_params_default);
  let db_bkp = detail_params_default.save_products.query;
  // let parsed_bkp = parse(db_bkp);
  // let json = JSON.stringify(parsed_bkp);
  var importObject = parse(db_bkp);//JSON.parse(json)
  console.log("importObject:", importObject);
  for (const toAdd of importObject["products"]) {
    console.log("importObject:", toAdd);
    for (const object of toAdd) {
      await db.put("products", object);
    }
  }
}
export async function exportToJson(db) {

  const exportObject = {}
  if (db.objectStoreNames.length === 0) {
    return JSON.stringify(exportObject)
  } else {

    for (const storeName of db.objectStoreNames) {
      const allObjects = []
      const product_exist = await db.getAll("products") || false;
      console.log("product_exist", product_exist);
      if (product_exist) {
        allObjects.push(product_exist);
      }
      exportObject["products"] = allObjects;
      // Last store was handled
      if (
        db.objectStoreNames.length ===
        Object.keys(exportObject).length
      ) {

      }
    }
    console.log("LIMIT REACHED:", exportObject);
    const stringified = stringify(exportObject);
    console.log("STRINGIFIED:", stringified);
    // const stringified_parse = parse(stringified);
    // console.log("STRINGIFIED PARSED:", stringified_parse);
    return stringified;
  }

}
export async function getNavigation(
  params: GetNavigationParams,
  contextInstance: ShopwareApiInstance = defaultInstance
): Promise<NavigationResponse> {

  const db = await openDB<MyDB>('my-db-1', 1, {
    upgrade(db) {
      db.createObjectStore('favourite-number');

      const productStore = db.createObjectStore('products', {
        keyPath: 'id', autoIncrement: true
      });
      productStore.createIndex('by-price', 'price');
      productStore.createIndex('by-path', 'path', { multiEntry: true });
      productStore.createIndex('by-detail-path', 'detail_path');
    },
  });
  console.log("--NAVIGATION--");
  // const IDBExportImport = require('indexeddb-export-import');
  // console.log("--IDB--", IDBExportImport);

  let db_bkp = await exportToJson(db);
  console.log("DB BKP:", db_bkp);

  let db_bkp_string = JSON.stringify(db_bkp);
  console.log("DB BKP STRING:", db_bkp_string);

  /* const test_db = await openDB<MyDB>('test-db', 1, {
    upgrade(db) {
      // db.createObjectStore('favourite-number');

      const productStore = db.createObjectStore('products', {
        keyPath: 'id', autoIncrement: true
      });
      productStore.createIndex('by-price', 'price');
      productStore.createIndex('by-path', 'path', { multiEntry: true });
      productStore.createIndex('by-detail-path', 'detail_path');
    },
  });
  let parsed_bkp = parse(db_bkp);
  let json = JSON.stringify(parsed_bkp);
  var importObject = parsed_bkp;//JSON.parse(json)
  console.log("importObject:", importObject);
  for (const storeName of test_db.objectStoreNames) {
    for (const toAdd of importObject[storeName]) {
      console.log("importObject:", toAdd);
      for (const object of toAdd) {
        await test_db.put(storeName, object);
      }
    }
  } */

  // console.log("Exported as JSON: " + JSON.stringify(exportObject));
  const indexDb = new indexDB("test");
  await indexDb.createObjectStore(["books", "students", "navigation"]);
  await indexDb.putValue("books", { name: "A Game of Thrones" });

  // This works
  await db.put('favourite-number', 7, 'Jen');
  const val = await db.get("favourite-number", 'top-navigation') || 0;
  console.log("val", val);
  let response;
  response = val;
  if (val == 0) {

    const resp = await contextInstance.invoke.post(
      getNavigationEndpoint(),
      params,
      { timeout: 300000 }
    );
    console.log("Response from API:", resp.data);
    await db.put("favourite-number", resp.data, "top-navigation");
    // await db.put("favourite-number", "topnav", resp.data);
    // await indexedDb.putValue("navigation", resp.data);
    await db.put("favourite-number", 'nav', "test_data");
    // await db.put("favourite-number", 3, "test_data");
    await db.put("favourite-number", 5, "{test_data}");

    // await db.put('products', {
    //   name: "test",
    //   price: 10,
    //   productCode: "T"
    // }, "test");

    // await db.put("favourite-number", 'topnav', resp.data);
    response = resp.data;
  }
  
  if (process.browser) {
    console.log("BROWSER - NAVIGATION");
    const product_exist = await db.getAll("products") || false;
    console.log("product_exist", product_exist);
    console.log("product_exist - length : ", product_exist.length);
    if (product_exist.length > 1300) {

      const response_template = await db.get("favourite-number", "page_response_place_holder");
      console.log("response_template", response_template);

      console.log("Response Children:", response.children);
      let path_array = {} as Path;
      path_array.path = [];
      get_path(response, path_array);
      console.log("Path Array:", path_array);

      var unique = path_array.path.filter(function (elem, index, self) {
        return index === self.indexOf(elem);
      });

      console.log("Unique Path Array:", unique);
      await db.put("favourite-number", unique, "unique-path-array");
      /* if (response_template) {
        response_template.cmsPage.sections[0].blocks[2].slots[0].data.listing.elements = [];
 
        let array_elements = [];
        let array_elements_media = [];
        for (let product of product_exist) {
          array_elements.push(product.element);
          for (let thumbnail of product.element.cover.media.thumbnails) {
            if (thumbnail.width == 200)
              array_elements_media.push(thumbnail.url);
          }
        }
        var elements_media = array_elements_media.join("','");
        console.log("MEDIA ENDPOINTS:", elements_media);
        response_template.cmsPage.sections[0].blocks[2].slots[0].data.listing.elements = array_elements;
        return response_template;
      } */
    } else {
      saveProducts(response, contextInstance);
      /* let params: ShopwareSearchParams = {
        limit: 500
      };
      const all_products = await contextInstance.invoke.post(getPageResolverEndpoint(), {
        path: "/",
        ...params,
      }, { timeout: 300000 });
      let array_elements_media = [];
      let elements = all_products.data.cmsPage.sections[0].blocks[2].slots[0].data.listing.elements;
      console.log("CMS Page Response ELEMENTS:", JSON.stringify(elements, null, 2));
      for (let element of elements) {
        console.log(element); // 1, "string", false
        if (element.translated.customFields.migration_BerndWolf_product_attr13 && element.translated.customFields.migration_BerndWolf_product_attr13.startsWith("K")) {
          console.log("Offline Elemeent - begin:", element);
          if (element.cover && element.cover.media) {
            array_elements_media.push(element.cover.media.thumbnails[0].url);
            for (let thumbnail of element.cover.media.thumbnails) {
              thumbnail.url = element.cover.media.url;
              //  array_elements_media.push(thumbnail.url);
            }
 
            console.log("Offline Elemeent end:", element);
            await db.put('products', {
              id: element.id,
              name: element.translated?.name,
              price: element.calculatedPrices[0].unitPrice,
              productCode: element.translated?.customFields?.migration_BerndWolf_product_attr13,
              element: element
            });
          }
        }
      }
      // console.log("MEDIA ENDPOINTS:",array_elements_media);
      var elements_media = array_elements_media.join("','");
      console.log("MEDIA ENDPOINTS:", elements_media);
      const val = await db.get("favourite-number", 'page_response_place_holder') || 0;
      console.log("val", val);
      if (val == 0) {
        const response_place_holder = all_products.data;
        //response_place_holder.cmsPage.sections[0].blocks[2].slots[0].data.listing.elements = [];
        await db.put("favourite-number", response_place_holder, "page_response_place_holder");
      } */
    }

  }
  /*  await db.put('products', { name: "test",
   price: 10,
   productCode: "T",
   key: "1"}); */
  return response;
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
