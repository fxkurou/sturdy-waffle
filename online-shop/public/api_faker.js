const fakerVersion = 1;
const baseUrl = window.location.origin;
const fakerDir = 'api_faker';
const imagesDir = `${baseUrl}/${fakerDir}/images`;
const webApiFetch = window.fetch;
const fakeApiOrigin = 'http://frontend-study.xenn.xyz';
const fakeApiPaths = {
    init: '/init',
    login: '/login',
    logout: '/logout',
    home: '/home',
    category: '/category',
    catalog: '/catalog',
    cart: '/cart'
};

window.fetch = function (url, options) {
    const urlObject = new URL(url);

    return urlObject.origin === fakeApiOrigin
        ? fakeFetch(urlObject, options)
        : webApiFetch(url, options);
}

function fakeFetch(url, options) {
    const responsePromise = new Promise(responseExecutor);

    return responsePromise;

    function responseExecutor(resolve) {
        const actionResult = fakeAction(url, options);
        const response = {
            ok: true,
            json: responseJson(actionResult)
        };

        resolve(response);
    }

    function responseJson(actionResult) {
        const jsonExecutor = resolve => resolve(actionResult);
        const jsonPromise = new Promise(jsonExecutor);

        return () => jsonPromise;
    }
}

function fakeAction(url, fetchOptions) {
    const endpoints = {
        [fakeApiPaths.init]: fakeInitData,
        [fakeApiPaths.login]: fakeLogin,
        [fakeApiPaths.logout]: fakeLogout,
        [fakeApiPaths.home]: fakeHomeData,
        [fakeApiPaths.category]: fakeCategoryData,
        [fakeApiPaths.catalog]: fakeCatalogData,
        [fakeApiPaths.cart]: fakeCartData
    };

    return endpoints[url.pathname]?.(url.searchParams, fetchOptions);
}

function checkVersion() {
    const versionStorageKey = 'apiFakerVersion';
    const clientVersion = localStorage.getItem(versionStorageKey);

    localStorage.setItem(versionStorageKey, fakerVersion);

    return clientVersion == fakerVersion;
}

function idFromTitle(title) {
    return title.replace(/[^a-zA-Z0-9]+/g, '_').toLowerCase();
}

function fakeLogoData() {
    return {
        imageUrl: `${imagesDir}/Logo.svg`,
        title: 'Frontend Study Project'
    };
}

function fakeCatalogsData(categoryKey) {
    const catalogTitles = fakeCatalogsTitles[categoryKey];

    return catalogTitles
        ? formatCatalogs(catalogTitles)
        : blankCatalogs();

    function formatCatalogs(titles) {
        return titles.reduce((collection, title) => {
            const catalogKey = idFromTitle(title);
            const catalog = {
                key: catalogKey,
                title,
                url: `${baseUrl}/catalog?collection=${catalogKey}`,
                imageUrl: `${imagesDir}/thumbs/catalogs/${catalogKey}.png`
            };

            collection.push(catalog);

            return collection;
        }, []);
    }

    function blankCatalogs() {
        const number = 17;
        const title = 'Lorem Ipsum';
        const url = `${baseUrl}/catalog/lorem-ipsum`;
        const imageUrl = `${imagesDir}/thumbs/catalogs/placeholder.png`;

        return Array(number).fill(null).map((item, index) => ({
            key: index,
            title,
            url,
            imageUrl
        }));
    }
}

function fakeNavigationData() {
    return fakeCategoriesTitles.reduce((data, categoryTitle) => {
        const categoryKey = idFromTitle(categoryTitle);
        const category = {
            key: categoryKey,
            title: categoryTitle,
            url: `${baseUrl}/category/${categoryKey}`,
            imageUrl: `${imagesDir}/thumbs/categories/${categoryKey}.png`,
            categories: fakeCatalogsData(categoryKey)
        };

        data.push(category);

        return data;
    }, []);
}

function fakeInitCartData() {
    return fakeCartData();
}

function fakeInitData() {
    return {
        app: fakeAppData(),
        navigation: fakeNavigationData(),
        logo: fakeLogoData(),
        footer: fakeFooterData(),
        cart: fakeInitCartData(),
        subscribtionPopup,
        ...(getLoginState() ? { user: fakeUserData() } : {})
    };
}

function fakeAppData() {
    return {
        baseUrl: window.location.origin
    };
}

function fakeLogin(searchParams, fetchOptions) {
    const payload = fetchOptions.body instanceof FormData 
        ? Object.fromEntries([...fetchOptions.body])
        : fetchOptions.body;
    const loginResult = checkLogin(payload);
    const loginOk = Object.values(loginResult).reduce((result, flag) => result && flag, true);

    loginOk && setLoginState(true);

    return {
        status: loginOk,
        ...(loginOk 
            ? { userData: fakeUserData() } 
            : { credentialsStatus: loginResult }
        )
    };
}

function checkLogin(payload) {
    const checker = (result, [key, value]) => ({ ...result, [key]: value === payload[key] })
    return Object.entries(fakeLoginData).reduce(checker, {});
}

function fakeUserData() {
    return {
        login: fakeLoginData.login,
        imageUrl: `${imagesDir}/user/avatar.png`
    };
}

function setLoginState(flag) {
    const storageKey = 'authenticated';
    localStorage.setItem(storageKey, flag || '');
}

function getLoginState() {
    const storageKey = 'authenticated';
    return localStorage.getItem(storageKey);
}

function fakeFooterData() {
    const links = fakeFooterTitles.map(title => {
        const key = idFromTitle(title);

        return {
            key,
            title,
            url: `${baseUrl}/${key}`
        };
    });

    return {
        links,
        copyrightText: fakeFooterCopyText
    };
}

function fakeHomeData() {
    const gallery = productsGallery();

    return {
        bannerRotator: fakeBannerRotator(fakeBannerRotatorTitles, 'collections'),
        featuredBrands: fakeBannerRotator(fakeFeaturedBrandsTitles, 'brands'),
        ...(gallery ? { gallery } : {} ),
        promoText: fakePromoText
    };
}

function fakeBannerRotator(titles, type) {
    const titleToItem = title => {
        const key = idFromTitle(title);

        return {
            key,
            title,
            url: `${baseUrl}/${type}/${key}`,
            imageUrl: `${imagesDir}/${type}/${key}.png`
        };
    };

    return titles.map(titleToItem);
}

function sortOptions(productData) {
    const collector = (collection, { key }) => ({
        ...collection,
        [key]: productData[key]
    });

    return frontendSortOptions.values.reduce(collector, {});
}

function sortProducts(products, option, direction) {
    const sortOptionValue = product => product.metadata[option];
    const directionSign = (-1) ** frontendSortDirections.values.indexOf(direction);
    const comparator = (leftItem, rightItem) => sortOptionValue(leftItem) > sortOptionValue(rightItem) ? 1 : -1;

    return products.sort((leftItem, rightItem) => directionSign * comparator(leftItem, rightItem));
}

function frontendFilterOptions(collectionOptions, products) {
    const allOptions = { ...frontendFilters, ...collectionOptions };
    const formatter = (filters, [key, list]) => {
        const type = filterTypes[key];

        filters[key] = {
            type,
            label: frontendFilters[key],
            options: type === 'checkbox' ? list : rangeFilterOptions(products, key)
        };

        return filters;
    };
    
    return Object.entries(allOptions).reduce(formatter, {});
}

function rangeFilterOptions(products, key) {
    const [keyFrom, keyTo] = [`${key}_from`, `${key}_to`];
    const init = { [keyFrom]: +Infinity, [keyTo]: 0 };
    const ranger = (ranger, product) => {
        const currentValue = product.metadata[key];

        return {
            [keyFrom]: Math.min(ranger[keyFrom], currentValue),
            [keyTo]: Math.max(ranger[keyTo], currentValue)
        };
    };

    return products.reduce(ranger, init);
}

function filterProducts(collection, searchParams) {
    const availableFilterParamNames = filterParamNames(collection.collectionData.filterOptions);
    const filtersPresent = [...searchParams.entries()].reduce((filters, [paramName, paramValue]) => {
        if (availableFilterParamNames.includes(paramName) && paramValue) {
            (filters[paramName] ||= []).push(paramValue);
        }

        return filters;
    }, {});

    return applyFilters(collection.products, filtersPresent);
}

function applyFilters(products, filters) {
    const filterSequence = (result, [key, value]) => applyFilter(result, key, value);
    return Object.entries(filters).reduce(filterSequence, products);
}

function applyFilter(products, key, values) {    
    const comparator = filterFunctions[optionFilterTypes[key]];
    const targetKey = filterTargetKey(key) ?? key;
    const filter = product => {
        const metadata = product.metadata[targetKey];
        const matcher = (result, value) => result || comparator(metadata, value);
        const matched = values.reduce(matcher, false);

        return matched;
    };
    
    return products.filter(filter);
}


function filterTargetKey(key) {
    const [targetKey, edgePostfix] = key.split('_');
    return targetKey;
}

function filterParamNames(collectionFilterOptions) {
    const reducer = (params, [key, filter]) => {
        const param = filter.type === 'checkbox'
            ? [key]
            : Object.keys(filter.options);
           
        return [...params, ...param];
    };

    return Object.entries(collectionFilterOptions).reduce(reducer, []);
}

function paginateProducts(collection, page, perPage = Infinity) {
    page ||= 1;

    const startIndex = (page - 1) * perPage;
    const endIndex = page * perPage;

    return collection.slice(startIndex, endIndex);
}

function metaOptions(productOptions) {
    return Object.entries(productOptions).reduce((options, [key, { id }]) => ({
         ...options,
         [key]: id
    }), {});
}

function fakeCatalogData(searchParams) {
    const collectionId = searchParams.get('collection');
    const sortOption = searchParams.get(frontendSortOptions.param);
    const sortDirection = searchParams.get(frontendSortDirections.param);
    const pageNumber = searchParams.get(frontendPaginatorOptions.param);
    const perPage = pageNumber ? productsPerPage : Infinity;
    const collections = getCollections();
    const collection = collections[collectionId];
    
    if (!collection) return {};

    const filteredProducts = filterProducts(collection, searchParams);
    const sortedProducts = sortProducts(filteredProducts, sortOption, sortDirection);
    const paginatedProducts = paginateProducts(sortedProducts, pageNumber, perPage);

    collection.collectionData.paginatorOptions.pages = Math.ceil(filteredProducts.length / productsPerPage);

    return {
        collectionData: collection.collectionData,
        products: paginatedProducts
    };
}

function getCollections() {
    const storageKey = 'fakeCollections';
    const fakerUpdated = checkVersion();

    return fakerUpdated && storedFakeCollections(storageKey) || storeFakeCollections(storageKey, fakeCollectionsData());
}

function getStoredCollections() {
    const collectionsStorageKey = 'fakeCollections';
    return storedFakeCollections(collectionsStorageKey);
}

function storedFakeCollections(storageKey) {
    const storedCollectionsJSON = localStorage.getItem(storageKey);
    return storedCollectionsJSON ? JSON.parse(storedCollectionsJSON) : null;
}

function storeFakeCollections(storageKey, collections) {
    localStorage.setItem(storageKey, JSON.stringify(collections));
    return collections;
}

function fakeCollectionsData() {
    const collections = generateFakeCollections();
    const formatter = (data, collection) => {
        const metadata = collection.collectionData;
        const extraOptions = {
            sortOptions: frontendSortOptions,
            orderOptions: frontendSortDirections,
            filterOptions: frontendFilterOptions(collection.metadata.allOptions, collection.products),
            paginatorOptions: frontendPaginatorOptions
        };

        Object.assign(metadata, extraOptions);

        return {
            ...data,
            [metadata.id]: collection
        }
    };

    return collections.reduce(formatter, {});
}

function generateFakeCollections() {
    const storesData = fakeStoreData();
    const { collection, ...components } = storesData;
    const builder = collectionData => generateFakeCollection(collectionData, components);

    return storesData.collection.map(builder);
}

function generateFakeCollection(collectionData, components) {
    const productsCount = fakeCollectionSize;
    const products = generateFakeProducts(components, productsCount);
    const metadata = { 
        allOptions: components
    };

    return {
        collectionData,
        products,
        metadata
    };
}

function generateFakeProducts(components, count) {
    return Array(count).fill(null).map(() => generateFakeProduct(components, count));
}

function generateFakeProduct(components) {
    const productOptions = fakeProductOptions(components);
    const name = randomProductName(productOptions);
    const id = idFromTitle(name);
    const price = generateRandomInt(4);
    const oldPrice = price + generateRandomInt(3);
    const rating = generateRandomInt(.75);
    const displayData = {
        name,
        price,
        oldPrice,
        rating,
        details: productDetails(productOptions)
    }
    const metadata = {
        id,
        name,
        price,
        rating,
        ...metaOptions(productOptions)
    };

    return {
        ...displayData,
        url: `${baseUrl}/product/?id=${id}`,
        imageUrl: `${imagesDir}/products/placeholder.png`,
        metadata
    };
}

function fakeProductOptions(components) {
    const builder = (options, [optionKey, optionItems]) => {
        const optionItem = randomArrayItem(optionItems);
        const option = { [optionKey]: optionItem };

        return { ...options, ...option };
    };

    return Object.entries(components).reduce(builder, {});
}

function randomProductName(productOptions) {
    return `${productOptions.manufacturer.label} ${generateRandomString(5).toUpperCase()}`;
}

function productDetails(productOptions) {
    return `${productOptions.processor.label} / ${productOptions.ram.label} / ${productOptions.storage.label}`;
}

function fakeCartData(searchParams, fetchOptions) {
    const cartStorageKey = 'fakeCart';
    const productIdKey = 'product_id';
    const updatingMethods = ['post', 'delete'];
    const productId = searchParams?.get(productIdKey);
    const method = fetchOptions?.method.toLowerCase();
    const updatingMethod = updatingMethods.includes(method);
    const cart = storedFakeCollections(cartStorageKey) ?? {};

    return productId && updatingMethod
        ? updateCart(cart, productId, method)
        : cartProductsData(cart);
}

function updateCart(cart, productId, method) {
    const cartStorageKey = 'fakeCart';
    const actions = {
        'post': addToCart,
        'delete': deleteFromCart
    };

    actions[method](cart, productId);
    storeFakeCollections(cartStorageKey, cart);

    return cartProductsData(cart);
}

function addToCart(cart, productId) {
    cart[productId] ||= 0;
    cart[productId]++;
}

function deleteFromCart(cart, productId) {
    delete cart[productId];
}

function cartProductsData(cart) {
    const collections = getStoredCollections();

    if (!collections) return {};

    const products = collectProducts(collections);
    const collectProductsInCart = (collection, id) => ({ ...collection, [id]: products[id] });
    const productsInCart = Object.keys(cart).reduce(collectProductsInCart, {});
    const cartData = calculateCartData(cart, productsInCart);
    
    return cartData;
}

function calculateCartData(cart, productsInCart) {
    const initialData = { items: [], cartTotalPrice: 0 };
    const calculate = (data, [id, qty]) => {
        const product = productsInCart[id];
        const price = product.metadata.price;
        const totalPrice = price * qty;
        const item = {
            id,
            qty,
            product,
            price,
            totalPrice
        };

        data.items.push(item);
        data.cartTotalPrice += totalPrice;

        return data;
    };
    const calculatedData = Object.entries(cart).reduce(calculate, initialData);

    return calculatedData;
}

function collectProducts(collections) {
    const lister = (list, collection) => list.concat(collection.products);
    const productsList = Object.values(collections).reduce(lister, []);
    const collector = (collection, product) => ({ ...collection, [product.metadata.id]: product });
    const productsCollection = productsList.reduce(collector, {});

    return productsCollection;
}

function fakeStoreData() {
    const sources = {
        collection: fakeCollectionsTitles,
        manufacturer: fakeManufacturersTitles,
        processor: fakeProcessorsTitles,
        ram: fakeRamsTitles,
        storage: fakeStoragesTitles
    };
    const formatter = (items, [key, titles]) => ({
        ...items,
        [key]: fakeStoreItemsData(titles)
    });

    return Object.entries(sources).reduce(formatter, {});
}

function fakeStoreItemsData(titles) {
    const formatter = (items, title) => {
        const item = {
            id: idFromTitle(title),
            label: title
        };

        items.push(item);

        return items;
    };

    return titles.reduce(formatter, []);
}

function fakeCategoryData(searchParams) {
    const categoryParamKey = 'category';
    const categoryId = searchParams.get(categoryParamKey);
    const titles = fakeCatalogsTitles[categoryId];
    const titleToItem = title => {
        const id = idFromTitle(title);

        return {
            id,
            title,
            url: `${baseUrl}/catalog/${id}`,
            imageUrl: `${imagesDir}/categories/placeholder.png`
        };
    };

    return titles?.map(titleToItem);
}

function fakeLogout() {
    setLoginState(false);
}

function productsGallery() {
    const collections = getStoredCollections();

    if (!collections) return null;

    const allProducts = collectProducts(collections);
    const allProductsList = Object.values(allProducts);
    const title = 'Products you\'ll probably like';
    const count = 10;
    const items = [];

    for (let i = 0; i < count; i++) {
        const randomProduct = randomArrayItem(allProductsList);
        items.push(randomProduct);
    }

    return { title, items };
}

function randomArrayItem(array) {
    const randomIndex = Math.floor(Math.random() * array.length);
    return array[randomIndex];
}

function generateRandomString(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let string = '';

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        string += characters.charAt(randomIndex);
    }

    return string;
}

function generateRandomInt(power) {
    return Math.floor(Math.random() * 10 ** power);
}

var fakeCategoriesTitles = ['Notebooks & PCs', 'Office Technics', 'TV', 'Gaming', 'Acoustics', 'Home Technics', 'Phones', 'Tabs'];
var fakeCatalogsTitles = {
    notebooks_pcs: ['Notebooks', 'PCs', 'Displays', 'Drives', 'Keyboards', 'Mices', 'Coolers', 'Motherboards', 'Power Stations',
        'Video Cards', 'Sound Cards', 'Memory', 'Flash Storages', 'Adapters', 'Software', 'Headphones', 'Processors', 'Routers', 'Cables',
        'Cases', 'Servers', 'TV Tuners', 'Optical Drives']
};
var fakeFooterTitles = ['About Us', 'Contacts', 'Terms & Conditions', 'Privacy Policy'];
var fakeFooterCopyText = '© Copyright 2023 Lorem Ipsum inc.';
var fakeBannerRotatorTitles = ['Server Equipment', 'Home PC Stations', 'Laptops & Netbooks', 'Office Equipment', 'Portable Assistants', 'Home Technics'];
var fakeCollectionsTitles = ['Notebooks', 'PCs'];
var fakeManufacturersTitles = ['Dell', 'Asus', 'Hewlett-Packard', 'Lenovo', 'Microsoft', 'Razer'];
var fakeProcessorsTitles = ['Intel Core i5', 'Intel Core i6', 'Intel Core i7', 'Intel Core i8', 'Intel Core i9', 'Intel Core i10', 'AMD Ryzen 4', 'AMD Ryzen 5', 'AMD Ryzen 6'];
var fakeRamsTitles = ['DDR3 4GB', 'DDR4 8GB', 'DDR5 16GB', 'DDR4 32GB', 'DDR5 64GB'];
var fakeStoragesTitles = ['SSD 240GB', 'SSD 512GB', 'SSD 1024GB', 'HDD 240GB', 'HDD 512GB', 'HDD 1024GB'];
var fakeFeaturedBrandsTitles = ['Dell', 'Asus', 'Hewlett-Packard', 'Apple', 'Microsoft', 'Acer'];
var fakePromoText = {
    title: 'Lorem ipsum',
    text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.'
};
var frontendSortOptions = {
    param: 'sort_by',
    values: [
        { key: 'rating', label: 'Rating' },
        { key: 'price', label: 'Price' },
        { key: 'name', label: 'Name' }
    ]
};
var frontendFilters = {
    manufacturer: 'Manufacturer',
    processor: 'Processor',
    ram: 'RAM',
    storage: 'Storage',
    price: 'Price'
};
var filterTypes = {
    manufacturer: 'checkbox',
    processor: 'checkbox',
    ram: 'checkbox',
    storage: 'checkbox',
    price: 'range'
};
var frontendSortDirections = {
    param: 'sort_order',
    values: ['asc', 'desc']
};
var optionFilterTypes = {
    manufacturer: 'equal',
    processor: 'equal',
    ram: 'equal',
    storage: 'equal',
    price_from: 'moreEqual',
    price_to: 'lessEqual'
};
var filterFunctions = {
    equal: (value, target) => value === target,
    moreEqual: (value, target) => value >= target,
    lessEqual: (value, target) => value <= target
};
var frontendPaginatorOptions = {
    param: 'page'
};
var fakeCollectionSize = 189;
var productsPerPage = 20;
var fakeLoginData = {
    login: 'mylogin',
    password: 'Mypassword'
};
var subscribtionPopup = {
    title: 'Subscribe for updates',
    text: 'Subscribe to our mailing list to get updates of offers and sales',
    successMessage: 'Thank you!',
    hideTimeout: 3
};
