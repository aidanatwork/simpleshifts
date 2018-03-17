//config/instance.js

// info specific to this instance of SimpleShifts

var dbuser     = 'smfpcal', //replace with your mongodb username
    //replace with your mongodb password
    dbpassword = '7Q4-EUn-CVz-Q66',
    //replace with your mongodb uri
    dburi      = 'ds111419-a0.mlab.com:11419,ds111419-a1.mlab.com:11419/smfp-db?replicaSet=rs-ds111419',
    //replace with the domain you wish to use for your instance
    domain     = 'smfpcal.com';
module.exports = {
    'database':'mongodb://' + dbuser + ':' + dbpassword + '@' + dburi,
    'options': {
        'key' : '/etc/apache2/ssl/smfpcal.key', //replace with the location of your SSL key
        'cert': '/etc/apache2/ssl/smfpcal.crt'/*,*/ //replace with the location of your SSL cert
        //'ca':'' //replace with your certificate authority, if you require one for your SSL setup
    },
    //replace with the custom domain name for your instance
    'origin': 'https://' + domain,
    //replace with your secret key
    'secret':'supersecretforyoureyesonly',
    //replace with the email alias you wish to use for server emails
    'emailservice':{
        service: 'SendGrid',
        user: 'apikey',
        pass: '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',
        fromname: 'passwordreset@smfpcal.com'
    },
    //replace with the name of the organization using this instance
    'title':'SMFP'
};