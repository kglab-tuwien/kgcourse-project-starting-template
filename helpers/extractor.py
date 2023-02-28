import json
from os import listdir
from os.path import isfile, join


mypath = "./wh"

filePaths = [join(mypath, f) for f in listdir(mypath) if isfile(join(mypath, f))]

exportData = []

properties = [
	"COORDINATES", 
	"POSTCODE", 
	"STATE", 
	"COUNTRY",

	"HEADING",
	"BODY_DYN"

	"PROPERTY_TYPE",
	"PROPERTY_TYPE_FLAT",
	"LOCATION_QUALITY",
	"ESTATE_SIZE",
	"ESTATE_SIZE/LIVING_AREA", 
	"FLOOR",
	"NUMBER_OF_ROOMS",
	"ROOMS",

	"RENT/PER_MONTH_LETTINGS",
	"PRICE",

	"PUBLISHED",
]

for filePath in filePaths:
	print(filePath)
	with open(filePath) as file:
		data = json.load(file)
		for advert in data['advertSummaryList']['advertSummary']:
			objData = {}
			for attribute in advert['attributes']['attribute']:
				if attribute['name'] in properties:
					objData[attribute['name']] = "||||".join(attribute['values'])
			

			if 'COORDINATES' not in objData:
				continue

			latLon = objData['COORDINATES'].split(",")

			objData['LATITUDE'] = latLon[0]
			objData['LONGITUDE'] = latLon[1]
			del objData['COORDINATES']

			exportData.append(objData)
			

with open('flat_info.json','w') as file:
	json.dump(exportData, file)
