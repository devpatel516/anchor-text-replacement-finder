const extractContent=require("../services/extractorService");
const crawlBlogPages=require("../services/crawlerService");
const axios=require("axios")
const extract=async(req,res)=>{
    try{
        const {url,anchorText,anchorTextLink}=req.body;
        if(!url || !anchorText || !anchorTextLink){
            return res.status(400).json({error:"Input field is missing"});
        }
        const result=[];
        const urls=await crawlBlogPages(url);
        console.log(urls);
        for(const u of urls){
            const contentData=await extractContent(u);
            console.log(contentData);
            result.push({url:u,...contentData,anchorText,anchorTextLink});
        }
        console.log(result)
        const response=await axios.post('http://127.0.0.1:8000/api/analyze',result,{
            headers:{
                'Content-Type':'application/json'
            }
        });
        res.json({
            ...response.data,
            crawledPages: urls
        });
    }catch(error){
        console.error(error);
        res.status(500).json({error:"Failed to extract content"});
    }
};


module.exports={extract};
