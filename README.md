# Work Event Generator

It creates a service that generates work events for a given period. It uses the given week offs 
(eg - sat & sun) and holidays falling in the given period as well as the future leave plan and
generates work events.

This service can be useful to forecast upcoming payrolls and prepare work plan for company's  full-time employees, 
considering bank holidays, weekly offs and employees’ holidays. 

## Running

```
// Node v6+ required
npm install
npm start # Starts the server on port 8765
npm test # Runs the test suite
```

## Server API

### `POST /v1/api/generate`

Creates work event for the given period.


#### Parameters
| Name            | Type            | Description                                    |
|:----------------|:----------------|:-----------------------------------------------|

| `country`       | `String`        | Country                                        |

| `period`        | `Object`        | Start and end date of period                   |

| `weekOff`       | `Array<String>` | Weekly offs                                    |

| `leaves`        | `Array<Object>` | Leave plans                                    |

| `formatType`    | `String`        | Format type of the response                    |

| `skip`          | `Number`        | Skip records of monthly details                |

| `limit`         | `Number`        | Limit records of monthly details               |

```
Request example -
curl -X POST \
  http://localhost:8765/v1/api/generate \
  -H 'cache-control: no-cache' \
  -H 'content-type: application/json' \
  -H 'postman-token: 693130e3-902f-005c-a3ea-f9f23487901a' \
  -d '{
	"country": "Finland",
	"formatType": "2",
	"period": {
		"start": "18 Jan 2018",
		"end": "30 Mar 2018"
	},
	"weekOff": [
		"sat",
		"sun"
	],
	"leaves": [
		{
    		"start": "16 Jan 2018",
    		"end": "22 Jan 2018"
    	},
    	{
    		"start": "21 Mar 2018",
    		"end": "28 Mar 2018"
    	}
	]
}'
```
```
Response example -
{ period: { start: '18 Jan 2018', end: '30 Mar 2018' },
  weekOff: [ 'sat', 'sun' ],
  totalDays: 72,
  totalWeeklyOffs: 20,
  totalHolidays: 2,
  leaveDetails:
   [ '18 Jan 2018',
     '19 Jan 2018',
     '22 Jan 2018',
     '21 Mar 2018',
     '22 Mar 2018',
     '23 Mar 2018',
     '26 Mar 2018',
     '27 Mar 2018',
     '28 Mar 2018' ],
  totalLeaves: 9,
  totalWorkingDays: 41,
  skip: '1',
  limit: '2',
  monthlyDetails:
   [ { period: [Object],
       weekOff: [Object],
       totalDays: 28,
       totalWeeklyOffs: 8,
       totalHolidays: 0,
       leaveDetails: [],
       totalLeaves: 0,
       totalWorkingDays: 20 },
     { period: [Object],
       weekOff: [Object],
       totalDays: 30,
       totalWeeklyOffs: 8,
       totalHolidays: 2,
       leaveDetails: [Object],
       totalLeaves: 6,
       totalWorkingDays: 14 } ] }
```