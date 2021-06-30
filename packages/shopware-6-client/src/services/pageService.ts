import { getPageResolverEndpoint } from "../endpoints";
import { defaultInstance, ShopwareApiInstance } from "../apiService";
import {
  SearchCriteria,
  ShopwareSearchParams,
} from "@shopware-pwa/commons/interfaces/search/SearchCriteria";
import {
  PageResolverResult,
  PageResolverProductResult,
  CmsPage,
} from "@shopware-pwa/commons/interfaces/models/content/cms/CmsPage";

import { convertSearchCriteria } from "../helpers/searchConverter";
import { getDefaultApiParams } from "@shopware-pwa/composables";
import * as idxdb from "idb";
import { IDBPDatabase, openDB } from "idb";
import { indexDB } from "../indexDB";

/**
 * @throws ClientApiError
 * @beta
 */
export async function getPage(
  path: string,
  searchCriteria?: SearchCriteria,
  contextInstance: ShopwareApiInstance = defaultInstance
): Promise<PageResolverResult<CmsPage>> {
  contextInstance.defaults.headers["sw-include-seo-urls"] = true;
  console.log("Search Criteria:", searchCriteria);
  console.log("Path:", path);
  const resp = await contextInstance.invoke.post(getPageResolverEndpoint(), {
    path: path,
    ...convertSearchCriteria({
      searchCriteria,
      config: contextInstance.config,
    }),
  });
  console.log("Page Response:", resp.data);
  return resp.data;
}

/**
 * @throws ClientApiError
 * @beta
 */
export async function getCmsPage(
  path: string,
  criteria?: ShopwareSearchParams,
  contextInstance: ShopwareApiInstance = defaultInstance
): Promise<PageResolverResult<CmsPage>> {
  contextInstance.defaults.headers["sw-include-seo-urls"] = true;
  console.log("Search Criteria-12:", criteria);
  console.log("Path:", path);

  let params: ShopwareSearchParams = {
    limit: 500,
  };

  console.log("Params:", params);
  // console.log("contextInstance:", self.$nuxt);
  console.log("Process:", process);
  if (process.browser) {
    console.log("BROWSER");
    if (self.$nuxt.isOffline) {
      console.log("OFFLINE");
      const db = await openDB<MyDB>("my-db-1", 1, {
        upgrade(db) {
          db.createObjectStore("favourite-number");

          const productStore = db.createObjectStore("products", {
            keyPath: "id",
            autoIncrement: true,
          });
          productStore.createIndex("by-price", "price");
          productStore.createIndex("by-path", "path", { multiEntry: true });
          productStore.createIndex("by-detail-path", "detail_path");
        },
      });
      if (!path) path = "/";
      let response;
      const unique_path_array =
        (await db.get("favourite-number", "unique-path-array")) || 0;
      if (unique_path_array != 0) {
        if (unique_path_array.includes(path)) {
          let transaction = db.transaction("products"); // readonly
          let books = transaction.objectStore("products");
          let priceIndex = books.index("by-price");

          let request = priceIndex.getAll(17.56275);
          console.log("Books", request);

          request.then((value) => {
            console.log(value);
            // expected output: "Success!"
          });

          var index = books.index("by-path");
          if (!path) path = "/";
          var test_1 = index.getAll(path);

          test_1.then((value) => {
            console.log("match call");
            var match = value;
            if (match) {
              console.log("Match");
              console.dir(match);
            }
          });
          let pathIndex = books.index("by-path");

          let product_request = pathIndex.getAll(path);
          console.log("product_request: ", product_request);
          const response_template = await db.get(
            "favourite-number",
            "page_response_place_holder"
          );

          response = product_request.then((value) => {
            console.log(value);
            // expected output: "Success!"

            const product_exist = value;
            console.log("product_exist", product_exist);
            if (product_exist.length > 0) {
              console.log("response_template", response_template);
              if (response_template) {
                response_template.cmsPage.sections[0].blocks[2].slots[0].data.listing.elements = [];

                let array_elements = [];
                let array_elements_media = [];
                for (let product of product_exist) {
                  array_elements.push(product.element);
                  for (let thumbnail of product.element.cover.media
                    .thumbnails) {
                    if (thumbnail.width == 200)
                      array_elements_media.push(thumbnail.url);
                  }
                }
                var elements_media = array_elements_media.join("','");
                console.log("MEDIA ENDPOINTS:", elements_media);
                response_template.cmsPage.sections[0].blocks[2].slots[0].data.listing.elements = array_elements;
                return response_template;
              }
            }
          });
        } else {
          const db_1 = await openDB<MyDB>("my-db-1", 1, {
            upgrade(db) {
              db.createObjectStore("favourite-number");

              const productStore = db.createObjectStore("products", {
                keyPath: "id",
                autoIncrement: true,
              });
              productStore.createIndex("by-price", "price");
            },
          });
          let transaction = db_1.transaction("products"); // readonly
          let books = transaction.objectStore("products");
          var path_index = books.index("by-detail-path");

          if (!path) path = "/";
          console.log("Path:", path);
          let test = path_index.get(path);
          console.log("test", test);
          console.log("STATUS:", self.$nuxt.isOffline);
          if (self.$nuxt.isOffline != true) {
            console.log("--INSIDE NOT RESPONSE--NOT OFFLINE-- BEGIN", response);
            const resp = await contextInstance.invoke.post(
              getPageResolverEndpoint(),
              {
                path: path,
                ...criteria,
              }
            );
            response = resp.data;
            console.log("--INSIDE NOT RESPONSE--NOT OFFLINE-- END", response);
          }

          response = test.then((value) => {
            console.log("match call");
            var match = value;
            if (match) {
              console.log("DETAIL PAGE:", value.detail_page);

              return value.detail_page;
            }
          });
          // return response;
        }
      }

      if (!response) {
        console.log("--INSIDE NOT RESPONSE--BEGIN--");
        const resp = await contextInstance.invoke.post(
          getPageResolverEndpoint(),
          {
            path: path,
            ...criteria,
          },
          { timeout: 300000 }
        );
        console.log("--INSIDE NOT RESPONSE--");
        response = resp.data;
      }
      console.log("--RESPONSE--", response);
      return response;
    }
  } else {
    console.log("ONLINE");
    //console.log("CMS Page Response CLIENT:", resp.data.cmsPage.sections);
  }
  let detail_params_default = getDefaultApiParams();
  console.log("DETAIL PARAMS DEFAULT: ", detail_params_default);
  const resp = await contextInstance.invoke.post(
    getPageResolverEndpoint(),
    {
      path: path,
      // "no-aggregations": 1,
      ...criteria,
      // ...detail_params_default.useCms,
    },
    { timeout: 300000 }
  );
  console.log("SERVER");
  return resp.data;
  /* if (process.browser) {
    console.log("BROWSER");
    const db = await openDB<MyDB>('my-db-1', 1, {
      upgrade(db) {
        db.createObjectStore('favourite-number');

        const productStore = db.createObjectStore('products', {
          keyPath: 'id', autoIncrement: true
        });
        productStore.createIndex('by-price', 'price');
      },
    });

    const product_exist = await db.getAll("products") || false;
    console.log("product_exist", product_exist);
    if (product_exist.length > 0) {

      const response_template = await db.get("favourite-number", "page_response_place_holder");
      console.log("response_template", response_template);
      response_template.cmsPage.sections[0].blocks[2].slots[0].data.listing.elements = [];

      let array_elements = [];
      let array_elements_media = [];
      for (let product of product_exist) {
        array_elements.push(product.element);
        for(let thumbnail of product.element.cover.media.thumbnails){
          if(thumbnail.width == 200)
            array_elements_media.push(thumbnail.url);
        }
      }
      var elements_media = array_elements_media.join("','");
      console.log("MEDIA ENDPOINTS:", elements_media);
      response_template.cmsPage.sections[0].blocks[2].slots[0].data.listing.elements = array_elements;
      return response_template;
      let elements = resp.data.cmsPage.sections[0].blocks[2].slots[0].data.listing.elements;
      console.log("CMS Page Response ELEMENTS:", JSON.stringify(elements, null, 2));
      for (let element of elements) {
        console.log(element); // 1, "string", false
        await db.put('products', {
          id: element.id,
          name: element.translated?.name,
          price: element.calculatedPrices[0].unitPrice,
          productCode: element.translated?.customFields?.migration_BerndWolf_product_attr13,
          element: element
        });
      }
    } else {

      const all_products = await contextInstance.invoke.post(getPageResolverEndpoint(), {
        path: path,
        ...params,
      }, { timeout: 300000 });
      let array_elements_media = [];
      let elements = all_products.data.cmsPage.sections[0].blocks[2].slots[0].data.listing.elements;
      console.log("CMS Page Response ELEMENTS:", JSON.stringify(elements, null, 2));
      for (let element of elements) {
        console.log(element); // 1, "string", false
        if (element.translated.customFields.migration_BerndWolf_product_attr13.startsWith("K")) {
          console.log("Offline Elemeent - begin:", element);
          array_elements_media.push(element.cover.media.thumbnails[0].url);
          for(let thumbnail of element.cover.media.thumbnails){
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
      // console.log("MEDIA ENDPOINTS:",array_elements_media);
      var elements_media = array_elements_media.join("','");
      console.log("MEDIA ENDPOINTS:", elements_media);
      const val = await db.get("favourite-number", 'page_response_place_holder') || 0;
      console.log("val", val);
      if (val == 0) {
        const response_place_holder = all_products.data;
        //response_place_holder.cmsPage.sections[0].blocks[2].slots[0].data.listing.elements = [];
        await db.put("favourite-number", response_place_holder, "page_response_place_holder");
      }
    }

  } */
  //console.log("CMS Page Response:", resp.data.cmsPage.sections);
  // console.log("CMS Page Response BLOCKS:", JSON.stringify(resp.data.cmsPage.sections[0].blocks[2].slots[0].data.listing, null, 2));

  // if (!('indexedDB' in window)) {
  //   console.log('This browser doesn\'t support IndexedDB');
  // }
  /*  const indexedDb = new indexDB('test');
     await indexedDb.createObjectStore(['books', 'students']);
     await indexedDb.putValue('books', { name: 'A Game of Thrones' });
     await indexedDb.putBulkValue('books', [{ name: 'A Song of Fire and Ice' }, { name: 'Harry Potter and the Chamber of Secrets' }]);
     await indexedDb.getValue('books', 1);
     await indexedDb.getAllValue('books');
     await indexedDb.deleteValue('books', 1); */
  /* const db = await openDB<MyDB>('my-db-1', 1, {
    upgrade(db) {
      db.createObjectStore('favourite-number');

      const productStore = db.createObjectStore('products', {
        keyPath: 'productCode', autoIncrement: true
      });
      productStore.createIndex('by-price', 'price');
    },
  }); */
}

/**
 * @throws ClientApiError
 * @beta
 */
export async function getProductPage(
  path: string,
  searchCriteria?: SearchCriteria,
  contextInstance: ShopwareApiInstance = defaultInstance
): Promise<PageResolverProductResult> {
  if (process.browser) {
    console.log("BROWSER");
    const db = await openDB<MyDB>("my-db-1", 1, {
      upgrade(db) {
        db.createObjectStore("favourite-number");

        const productStore = db.createObjectStore("products", {
          keyPath: "id",
          autoIncrement: true,
        });
        productStore.createIndex("by-price", "price");
      },
    });
    let transaction = db.transaction("products"); // readonly
    let books = transaction.objectStore("products");

    /* let priceIndex = books.index("by-price");

    let request = priceIndex.getAll(17.56275);
    console.log("Books", request);

    request.then((value) => {
      console.log(value);
      // expected output: "Success!"
    }); */

    var index = books.index("by-detail-path");

    if (!path) path = "/";
    console.log("Path:", path);
    var test = index.getAll(path.split(","));
    console.log("test", test);
    test.then((value) => {
      console.log("match call");
      var match = value;
      if (match) {
        console.log("Match");
        console.dir(match);
      }
    });
  }
  const resp = await contextInstance.invoke.post(getPageResolverEndpoint(), {
    path: path,
    ...convertSearchCriteria({
      searchCriteria,
      config: contextInstance.config,
    }),
  });
  console.log("Product Page Response:", resp.data);
  return resp.data;
}

/**
 * Returns an array of SEO URLs for given entity
 * Can be used for other languages as well by providing the languageId
 *
 * @beta
 */
export async function getSeoUrls(
  entityId: string,
  languageId?: string,
  contextInstance: ShopwareApiInstance = defaultInstance
): Promise<
  {
    apiAlias: string;
    seoPathInfo: string;
  }[]
> {
  if (languageId) {
    contextInstance.defaults.headers["sw-language-id"] = languageId;
  }
  const resp = await contextInstance.invoke.post("/store-api/v3/seo-url", {
    filter: [
      {
        type: "equals",
        field: "foreignKey",
        value: entityId,
      },
    ],
    includes: {
      seo_url: ["seoPathInfo"],
    },
  });

  return resp.data;
}
