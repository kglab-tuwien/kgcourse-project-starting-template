# Data

This contains the json data, you get when you look for the requests at willhaben.

For example, when you call `https://www.willhaben.at/iad/immobilien/mietwohnungen/wien?rows=30&sort=3&page=5`
you find a request to `https://www.willhaben.at/webapi/iad/search/atz/seo/immobilien/mietwohnungen/wien?rows=30....`

You copy this result in a json file and then you can extract the flats for the project.

The generated converted json file `flat_info.json` is then copied into the `assets/data` folder

## Warning

Please do not scrape Willhaben, and just copy some data for demo purposes 
like a normal user is using the website.
