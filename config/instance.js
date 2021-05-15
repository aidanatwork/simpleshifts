var dbuser     = process.env.DBUSER,
    dbpassword = process.env.DBPASSWORD,
    dburi      = process.env.DBURI,
    domain     = process.env.DOMAIN,
    email_serv_pwd = process.env.EMAIL_SERV_PWD,
    ssl_key_loc = process.env.SSL_KEY_LOC,
    ssl_cert = process.env.SSL_CERT,
    ssl_cert_auth = process.env.SSL_CERT_AUTH,
    secret = process.env.SECRET,
    org_name = process.env.ORG_NAME;
module.exports = {
    /* info specific to this instance of SimpleShifts */
    'database':'mongodb+srv://' + dbuser + ':' + dbpassword + '@' + dburi,
    //replace with the email alias you wish to use for server emails
    'emailservice':{
        service: 'SendGrid',
        user: 'apikey',
        pass: email_serv_pwd,
        fromname: 'passwordreset@' + domain //displayed "from" email for pwd communications
    },
    'options': {
        'key' : ssl_key_loc, //replace with the location of your SSL key
        'cert': ssl_cert, //replace with the location of your SSL cert
	'ca': ssl_cert_auth //replace with your cert. authority
    },
    //replace with the custom domain name for your instance
    'origin': 'https://' + domain,
    //replace with your secret key
    'secret':secret,
    //replace with the name of the organization using this instance
    'title':org_name
};
