import RNFetchBlob from 'rn-fetch-blob';
import cheerio from 'cheerio';

//scrapes the html code from an URL
export const scrapeHtml = async (url: string) => {
  try {
    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';

    const response = await RNFetchBlob.fetch('GET', url, {
      'User-Agent': userAgent,
    });
    const html = response.data;
    const $ = cheerio.load(html);
    const extractedContent = $('body').html();

    if (extractedContent) {
      return parseHTML(extractedContent);
    } else {
      return "error";
    }
  } catch (error) {
    console.error('Error fetching HTML:', error);
    return "error";
  }
};

//removes the unnecessary parts from the HTML
const parseHTML = (htmlContent: string) => {
    const $ = cheerio.load(htmlContent);
    const uniqueTextSet = new Set<string>();
    const textRegex = />([^<{[\]}]*)</gi;
  
    $('*').each((index, element) => {
      const html = $(element).html();
      if (html) {
        const matches = html.match(textRegex);
        if (matches) {
          matches.forEach((match) => {
            const text = match.replace(/<[^>]*>/g, '').trim();
            if (text) {
              uniqueTextSet.add(text);
            }
          });
        }
      }
    });
  
    $('a').each((index, element) => {
      const href = $(element).attr('href');
      if (href) {
        const anchorText = $(element).text().trim();
        if (anchorText) {
          uniqueTextSet.add(`Link's Text: ${anchorText}, Href: ${href}`);
        }
      }
    });

    const uniqueTextArray = Array.from(uniqueTextSet);
    let extractedText = uniqueTextArray.join(';;;');
    extractedText = extractedText.replaceAll('<;;;>', ';')
    extractedText = extractedText.replace(/\n/g, '');
    extractedText = extractedText.trim();
  
    return extractedText;
  };

  //calls the above two functions in order
export const getPrunedHtml = async (url: string) => {
  const res = await scrapeHtml(url);
  return(res);
};