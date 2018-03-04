var dbuser     = '', //replace with your mongodb username
    dbpassword = '', //replace with your mongodb password
    dburi      = ''; //replace with your mongodb uri

module.exports = {
    // info specific to this instance of SimpleShifts
    'options': {
        'key' : '', //replace with the location of your SSL key
        'cert': '' //replace with the location of your SSL cert
    },
    //replace with the custom domain name for your instance
    'origin': '',
    //replace with your secret key
    'secret':'',
    //replace with the name of the organization using this instance
    'title':'',
    'database':'mongodb://' + dbuser + ':' + dbpassword + '@' + dburi
};