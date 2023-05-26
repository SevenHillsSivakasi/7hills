var express = require('express');
var router = express.Router();
var Client = require('../modals/clients');
var Product = require('../modals/product');
var Transport = require('../modals/transport');
var Bill = require('../modals/bill');
const { ToWords } = require('to-words');
const toWords = new ToWords();
var Xvfb = require('xvfb');
var xvfb = new Xvfb();

const fs = require('fs');

/* GET home page. */
router.get('/', function(req, res, next) {
  Bill.find(function(err,bills){
    if(err){
      console.log(err);
      return res.redirect('/');
    }
    Client.find(function(err,clients){
      if(err){
        console.log(err);
        return res.redirect('/');
      }
      res.render('index', { title: 'Home | Seven Hills', bills:bills, clients:clients});
    })
    
  }).sort({invoiceNumber:-1});
});

// Products ARea

router.get('/newProduct', function(req,res,next){
  Product.find(function(err,result){
    if(err){
      console.log(err);
      return res.redirect('/');
    }
    res.render('product', {title:'New Product | Seven Hills',products:result});
})
});

router.post('/addNewProduct', function(req,res,next){
  console.log(req.body);
  var product = new Product({
    name:req.body.productName,
    bf:req.body.bf,
    GSM:req.body.gsm,
    Size:req.body.size,
    rate:req.body.rate,
  })
  product.save(function(err,result){
    if(err){
      console.log(err);
      return res.redirect('/index');
    }
    res.redirect('/newProduct');
  })

})

router.post('/updateProduct/:id', function(req,res,next){
  var id = req.params.id;
  Product.findByIdAndUpdate(
    {_id:id},
    {$set:{
      name:req.body.productName,
      bf:req.body.bf,
      gsm:req.body.gsm,
      size:req.body.size,
      rate:req.body.rate
    }}, 
    function(err,result){
      if(err){
        console.log(err);
        return res.redirect('/');
      }
      res.redirect('/newProduct');
    }
    )
})

router.get('/deleteProduct/:id', function(req,res,next){
  var id = req.params.id;
  Product.deleteOne({_id:id}, function(err,result){
    if(err){
      console.log(err);
      return res.redirect('/');
    }
    res.redirect('/newProduct');
  })
})

// Bill ARea

router.get('/newBill', function(req, res, next) {

  Client.find(function(err,result){
    if(err){
      console.log(err);
      return res.render('/');
    }
    Product.find(function(err,result1){
      if(err){
        console.log(err);
        return res.render('/');
      }
      Transport.find(function(err,transport){
        if(err){
          console.log(err);
          return res.render('/');
        }
        res.render('newBill', { title: 'New Bill | Seven Hills', parties:result, products:result1, transports:transport });
      })
      
    })
    
  })
  
});


router.post('/newBillValues', function(req,res,next){

  var invoiceNumber = req.body.invoiceNo;
  var invoiceDate = req.body.invoiceDate;
  var cusId = req.body.partyName;

  console.log(req.body);
    
  const {itemName} = req.body;
  var itemNames = [];
  itemNames = itemName;

  const {bf} = req.body;
  var bfs = [];
  bfs = bf;

  const {gsm} = req.body;
  var gsms = [];
  gsms = gsm;

  const {size} = req.body;
  var sizes = [];
  sizes = size;

  const {weight} = req.body;
  var weights = [];
  weights = weight;

  const {reels} = req.body;
  var reelss = [];
  reelss = reels;

  const {itemRate} = req.body;
  var rates = [];
  rates = itemRate;

  const {itemAmount} = req.body;
  var amounts = [];
  amounts = itemAmount;




  var cartItems = []
  var totalReels = 0;
  var netWeight = 0;
  var totalBillValue = 0;
  
  var igst = 0;
  var cgst = 0;
  var sgst = 0;

  var gstValueFull = req.body.gstValue;
  var gstValueHalf = Number(gstValueFull)/2;

  var billValueAfterGST = 0;


  for(i=0; i<itemNames.length;i++){
    if(weights[i]>0){
      cartItems.push(
        {
          name:itemNames[i],
          bf:bfs[i],
          GSM:gsms[i],
          Size:sizes[i],
          weight:weights[i],
          reels:reelss[i],
          rate:rates[i],
          amount:amounts[i]
        }
        )
    }
  }

  cartItems.forEach(item=>{
    totalReels += Number(item.reels);
    netWeight += Number(item.weight);
    totalBillValue += Number(item.amount);
  })

  console.log(cartItems, cusId, totalReels, netWeight, totalBillValue, req.body.transport);

  Client.findById(cusId, function(err,resultt){
    if(err){
      console.log(err);
      return res.render('newBill');
    }
    if(resultt.gstType === "Central"){
      igst = (totalBillValue * gstValueFull)/100;
      billValueAfterGST = Math.round(Number( igst + totalBillValue));
    }
    else if(resultt.gstType === "State"){
      cgst = (totalBillValue * gstValueHalf)/100;
      sgst = (totalBillValue * gstValueHalf)/100;
      billValueAfterGST = Math.round(Number(cgst + sgst + totalBillValue));
    }

    console.log('CGST : ' + cgst);
    console.log('SGST : ' + sgst);
    console.log('IGST : ' + igst);
    console.log('TotalBillValue : ' + billValueAfterGST);
    console.log(toWords.convert(billValueAfterGST, { currency: true }));

    var bill = new Bill({
      invoiceNumber:invoiceNumber,
      billDate:invoiceDate,
      party:resultt.name,
      address1:resultt.address1,
      address2:resultt.address2,
      city:resultt.city,
      state:resultt.state,
      gstNo:resultt.gstNo,
      gstType:resultt.gstType,
      cgstV:gstValueHalf + "%",
      sgstV:gstValueHalf + "%",
      igstV:gstValueFull,
      panAadhar:resultt.panAadhar,
      transport:req.body.transport,
      billItems:cartItems,
      billAmount:billValueAfterGST,
      totalReels:totalReels,
      netWeight:netWeight,
      taxableValue:totalBillValue.toFixed(2),
      cgst:cgst.toFixed(2),
      sgst:sgst.toFixed(2),
      igst:igst.toFixed(2),
      totalBillValue: billValueAfterGST.toFixed(2),
      amountInWords:toWords.convert(billValueAfterGST, { currency: true })
    })

    bill.save(function(err,result){
      if(err){
        console.log(err);
        return res.render('newBill');
      }
      res.redirect('/');
    })

  })
  
})

router.get('/deleteBill/:id', function(req,res,next){
  var id = req.params.id;
  Bill.deleteOne({_id:id}, function(err,delRes){
    if(err){
      console.log(err);
      return res.redirect('/');
    }
    res.redirect('/');
  })
})

// Party Area

router.get('/newParty', function(req,res,next){
  res.render('newParty', {title:'New Party | Seven Hills'});
})

router.post('/addNewParty', function(req,res,next){

  var client = new Client({
    name:req.body.partyName,
    address1:req.body.partyAdd1,
    address2:req.body.partyAdd2,
    city:req.body.partyCity,
    state:req.body.partyState,
    gstNo:req.body.partyGST,
    panAadhar:req.body.partyPAN,
    gstType:req.body.gstType    
  })
  client.save(function(err,result){
    if(err){
      console.log(err);
      return res.render('newParty');
    }
    res.redirect('/newParty');
  })

})

router.post('/updateParty/:id', function(req,res,next){
  var id = req.params.id;
  Client.findByIdAndUpdate(
    {_id:id},
    {$set:{
      name:req.body.partyName,
      address1:req.body.address1,
      address2:req.body.address2,
      city:req.body.city,
      state:req.body.state,
      gstNo:req.body.gstNo,
      panAadhar:req.body.panAadhar
    }}, 
    function(err,result){
      if(err){
        console.log(err);
        return res.redirect('/');
      }
      res.redirect('/');
    }
    )
})

router.get('/deleteClient/:id', function(req,res,next){
  var id = req.params.id;
  Client.deleteOne({_id:id}, function(err,result){
    if(err){
      console.log(err);
      return res.redirect('/');
    }
    res.redirect('/');
  })
})

// Transport Area

router.get('/transport', function(req,res,next){
  Transport.find(function(err,transports){
    if(err){
      console.log(err);
      return res.render('transport');
    }
    res.render('transport',{title:'Transport | Seven Hills', transports:transports});
  })
  
})

router.post('/addNewTransport', function(req,res,next){
  var transport = new Transport({
    name:req.body.transportName,
    place:req.body.place,
  })
  transport.save(function(err,result){
    if(err){
      console.log(err);
      return res.render('/');
    }
    res.redirect('/transport');
  })

})

router.post('/updateTransport/:id', function(req,res,next){
  var id = req.params.id;
  Transport.findByIdAndUpdate(
    {_id:id},
    {$set:{
      name:req.body.transportName,
      place:req.body.transportPlace,
    }}, 
    function(err,result){
      if(err){
        console.log(err);
        return res.redirect('/');
      }
      res.redirect('/transport');
    }
    )
})

router.get('/deleteTransport/:id', function(req,res,next){
  var id = req.params.id;
  Transport.deleteOne({_id:id}, function(err,result){
    if(err){
      console.log(err);
      return res.redirect('/');
    }
    res.redirect('/transport');
  })
})

// Print Bill Area

router.get('/printBillOriginal/:id', function(req,res,next){
  var id = req.params.id;
  Bill.findById({_id:id}, function(err,result){
    if(err){
      console.log(err);
      return res.redirect('/');
    }
   
    var fileName = './result.pdf';

    res.render('invoicegenerator', {bill:result}, function(err,html){
      
      if(err){
        return console.log(err);
      }

    (async () => {

      // var xvfb = new Xvfb({
      //   silent: true,
      //   xvfb_args: ["-screen", "0", '1280x720x24', "-ac"],
      // });
      
      xvfb.start((err)=>{if (err) console.error(err)});
    
      const PCR = require("puppeteer-chromium-resolver");
      const puppeteer = require('puppeteer');
      const option = {
        revision: "",
        detectionPath: "",
        folderName: ".chromium-browser-snapshots",
        defaultHosts: ["https://storage.googleapis.com", "https://npm.taobao.org/mirrors"],
        hosts: [],
        cacheRevisions: 2,
        retry: 3,
        silent: false
    };

    const stats = PCR.getStats(option);
    
       

    if(stats){
      const browser = await stats.puppeteer.launch({
          headless:false,
          args: ['--no-sandbox','--disable-setuid-sandbox'],
          executablePath: stats.executablePath
        }); 

          // create a new page
          const page = await browser.newPage();

          // Configure the navigation timeout
          await page.setDefaultNavigationTimeout(0);

         await page.setCacheEnabled(false); 
         // set your html as the pages content
          
          await page.setContent(html, {
            waitUntil: 'domcontentloaded'
          })
          await page.emulateMediaType('screen');
  
      // create a pdf buffer
          const pdfBuffer = await page.pdf({
            format: 'A4',
            path: fileName,
            printBackground:true
          })

          console.log('done');
          res.header('content-type','application/pdf');
          res.send(pdfBuffer);

      // close the browser
          await browser.close();



    }
    else{

      const stats = await PCR(option);
      const browser = await stats.puppeteer.launch({
          headless:false,
          args: ['--no-sandbox','--disable-setuid-sandbox'],
          executablePath: stats.executablePath
        }); 
   
      // launch a new chrome instance
        // create a new page
        const page = await browser.newPage();

        // Configure the navigation timeout
        await page.setDefaultNavigationTimeout(0);

       await page.setCacheEnabled(false); 
       // set your html as the pages content
        
        await page.setContent(html, {
          waitUntil: 'domcontentloaded'
        })
        await page.emulateMediaType('screen');

    // create a pdf buffer
        const pdfBuffer = await page.pdf({
          format: 'A4',
          path: fileName,
          printBackground:true
        })

        console.log('done');
        res.header('content-type','application/pdf');
        res.send(pdfBuffer);

    // close the browser
        await browser.close();
    }
   
     
         
  
    
  
  })().catch((error) =>{
    console.error("the message is " + error.message);
  });

})

 

      
    });
})


module.exports = router;
