GPP CMPAPI from terminal/console in python:
(for debugging purposes)

Navigate to the folder that contains cmp_api_python. Start the python interpreter using python3
Then paste the following (with whatever gpp string you want to decode):

from cmp_api_python import cmpapi_test
c = cmpapi_test.CmpApi()
gppString = 'DBABBg~BUUAAAGA.YA'
cmpapi_test.decode(gppString, c)

The decoding will be printed. 