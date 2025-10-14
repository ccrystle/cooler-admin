curl -X 'POST' \
  'http://localhost:8888/v2/footprint/products' \
  -H 'accept: application/json' \
  -H 'COOLER-API-KEY: cooler_live_cc612208-c023-479b-87f8-1de0730c2fd2' \
  -H 'Content-Type: application/json' \
  -d '{
  "items": [
    {
      "productPrice": 0,
      "productName": "Samsung A7 Galaxy",
      "productDescription": "Samsung A7 Galaxy",
      "postalCode": "02062",
      "newProduct": true,
      "externalId": "6c233e4f-3f55-43fe-b67b-0ce50e5f7177"
    }
  ]
}'