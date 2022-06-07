
function singleReplace(re,str,isRegExp,useJS,flags) {
  singleReplacePartial(re,str,isRegExp,useJS,flags,true,true);
};
  
function singleReplacePartial(re,str,isRegExp,useJS,flags,bodyFlag,fnFlag) {
  // isRegExp: Is the string passed in a regexp or a literal string?
  // useJS: 
  // Seems that the find function doesn't take a regexp, but just a string...
  // https://developers.google.com/apps-script/reference/document/text#replaceText(String,String)
  // Therefore, you can switch on useJS, to use the JS engine. Because this operates on text, you would lose formatting.
  // Hence, the expressing is 'padded', see repad below, and only the matching text is retained. Then GAS replace is used.
  // useJS may have unexpected side effects and should only be used if you require features that are not in re2 but are in JS (suchas '$1')
  if (!isRegExp) {
    re = re.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&');
    //    re = re.replace(/[\|\\\{\}\(\)\[\]^$\+\*\?\.]/g, '\\$&');
  };
  //var reg = new RegExp(re);
  // string - for use in findtext and replacetext
  var regu = re;
  // regexp - for use in replace
  var regexp = null;
  // why this?
  // var repad = ".*?(?:"+re+").$";
  var repad = re;
  if (flags) { 
    regexp = new RegExp(repad, flags);
  } else {
    regexp = new RegExp(repad);
  };
  // DocumentApp.getUi().alert("Search: " + regu.toString() );
/*
  var bodyElement = DocumentApp.getActiveDocument().getBody();
*/  
  var p;
  try {
    p = getParagraphsInBodyAndFootnotesExtended(false, bodyFlag, fnFlag);
  } catch (e) {
    alert('Error in singleReplacePartial calling getParagraphsInBodyAndFootnotesExtended: ' + e);
  };
  if (p) {
    for (var i=0; i < p.length; i++) {
      var bodyElement = p[i];
      var rangeElement = bodyElement.findText(regu);
      var replacement;
      while (rangeElement !== null) {
        //DocumentApp.getUi().alert("Found" );
        var thisElement = rangeElement.getElement();
        //var thisElementText = thisElement.asText();
        // work-around to be able to use JS regexp engine
        // https://stackoverflow.com/questions/30968419/replacetext-regex-not-followed-by/33528920#33528920 
        if (useJS) {
          
           alert("useJS not working");
          /*
                  // Determine the input text:
          var mytext =  rangeElement.getElement().getText();
          var elem = rangeElement.getElement().copy().editAsText();
          var elemlength = elem.getText().length;
          if (rangeElement.isPartial()) {
            if (rangeElement.getEndOffsetInclusive()+1 < elemlength-1) {
              elem.deleteText(rangeElement.getEndOffsetInclusive()+1,elemlength-1);
            }
            if (rangeElement.getStartOffset()-1>0) {
              elem.deleteText(0,rangeElement.getStartOffset()-1);
            };
            elemlength = elem.getText().length;
          };
          var url = null;
          // var text = elem.getText();                                        
          alert(regexp+ "\n" + str + "\n" + thisElement.getText() + "\n" + elem.getText());
          replacement = thisElement.getText().replace(regexp,str);
          
          var eat = rangeElement.getElement().editAsText();
          eat.deleteText(rangeElement.getStartOffset(),rangeElement.getEndOffsetInclusive());
          eat.insertText(rangeElement.getStartOffset(),replacement);      
          */
          
          alert(regexp+ "\n" + str + "\n" + thisElement.getText());
          replacement = thisElement.getText().replace(regexp,str);
        } else {
          replacement = str;
        }
        thisElement = thisElement.replaceText(regu, replacement);
        //.setBackgroundColor(searchResult.getStartOffset(), searchResult.getEndOffsetInclusive(),backgroundColor);
        // search for next match
        rangeElement = bodyElement.findText(regu, rangeElement);
      };
    };
  } else {
    alert("singleReplacePartial: No paragraphs found.");
  };
};
  
function singleReplaceKeepUrl(regu,replacement,isRegExp,offsetStart, offsetEnd) {
  // isRegExp: Is the string passed in a regexp or a literal string?
  try {
    if (!isRegExp) {
      regu = regu.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&');
    };
  } catch(e) {
    alert("Error in regu: "+e);
  };
  /*
  // This is just a basic replacement:
  var bodyElement = DocumentApp.getActiveDocument().getBody();
  var searchResult = bodyElement.findText(regu);
  var replacement = str;
  while (searchResult !== null) {
    var thisElement = searchResult.getElement();
    thisElement = thisElement.replaceText(regu, replacement);
    searchResult = bodyElement.findText(regu, searchResult);
  }
  */
  try {
    var doc = DocumentApp.getActiveDocument();
    var counter = 0;
    var p = getParagraphsInBodyAndFootnotes(false,true);
  } catch(e) {
    alert("Error in singleReplaceKeepUrl>getParagraphsInBodyAndFootnotes: "+e);
  };
  try {
  for (var i=0; i<p.length; i++) {
    try {
      var mybody = p[i];
      // Track through range elements
      var rangeElement = mybody.findText(regu);
      while (rangeElement !== null) {
        counter++;
        // Determine the input text:
        var mytext =  rangeElement.getElement().getText();
        var elem = rangeElement.getElement().copy().editAsText();
        var elemlength = elem.getText().length;
        if (rangeElement.isPartial()) {
          if (rangeElement.getEndOffsetInclusive()+1 < elemlength-1) {
            elem.deleteText(rangeElement.getEndOffsetInclusive()+1,elemlength-1);
          }
          if (rangeElement.getStartOffset()-1>0) {
            elem.deleteText(0,rangeElement.getStartOffset()-1);
          };
          elemlength = elem.getText().length;
        };
        var url = null;
        var text = elem.getText();
        // Find URL by tracking through the input text - take first available url
        for (var i=0; i < text.length; i++) {
          if (!url) {
            url = elem.getLinkUrl(i);
          };
        };
        // replacement = "{"+replacement+"}"
        eat = rangeElement.getElement().editAsText();
        eat.deleteText(rangeElement.getStartOffset(),rangeElement.getEndOffsetInclusive());
        eat.insertText(rangeElement.getStartOffset(),replacement);
        var pin = rangeElement.getStartOffset();
        var pout = rangeElement.getStartOffset() + replacement.length - 1;
        eat.setLinkUrl(pin, pout, null);
        pin += offsetStart;
        pout +=  offsetEnd;
        if (pout >= pin ) {
          eat.setLinkUrl(pin, pout, url);
        } else {
          //alert("Error setting link on: "+text);
        };
        rangeElement = mybody.findText(regu,rangeElement );
        rangeElement = null;
      };
    } catch(e) {
      alert(i+ " " + e);
    };
  }
  } catch(e) {
    alert("Error in singleReplaceKeepUrl: "+e);
  };
  return counter;
};


function regexpRestyle(target,mystyle,elementsIn) {
  regexpRestyleOffset(target,mystyle,0,0,elementsIn);
};

function regexpRestyleOffset(target,mystyle,startOff,endOff,elementsIn) {
  // If no search parameter was provided, ask for one
  if (arguments.length == 0) {
    var ui = DocumentApp.getUi();
    var result = ui.prompt('Text Highlighter',
      'Enter text to highlight:', ui.ButtonSet.OK_CANCEL);
    // Exit if user hit Cancel.
    if (result.getSelectedButton() !== ui.Button.OK) return;
    // else
    target = result.getResponseText();
  }
  var elements = [];
  if (!elementsIn) {
    elements = getParagraphsInBodyAndFootnotesExtended(false,true,true); 
  } else {
    elements = elementsIn;
  };
  for (var i=0; i<elements.length; i++) {
    var thisEl = elements[i];
    var searchResult = thisEl.findText(target);
    while (searchResult !== null) {
      var thisElement = searchResult.getElement();
      var thisElementText = thisElement.asText();
      // thisElementText.setAttributes(mystyle);
      thisElementText.setAttributes(searchResult.getStartOffset()+startOff, searchResult.getEndOffsetInclusive()+endOff,mystyle);    
      searchResult = thisEl.findText(target, searchResult);
    };      
  }
  
}

/*
This function is obsolete: It's a demonstration of how to do this operation all in one function. However it operates on the body only
*/
function regexpRestyleBodyOnly(target,mystyle,elementsIn) {
  // If no search parameter was provided, ask for one
  if (arguments.length == 0) {
    var ui = DocumentApp.getUi();
    var result = ui.prompt('Text Highlighter',
      'Enter text to highlight:', ui.ButtonSet.OK_CANCEL);
    // Exit if user hit Cancel.
    if (result.getSelectedButton() !== ui.Button.OK) return;
    // else
    target = result.getResponseText();
  }
  var elements = [];
  if (!elementsIn) {
    var doc = DocumentApp.getActiveDocument();
    var bodyElement = DocumentApp.getActiveDocument().getBody();
    elements[0] = bodyElement;
  } else {
    elements = elementsIn;
  };
  for (var i=0; i<elements.length; i++) {
    var thisEl = elements[i];
    var searchResult = thisEl.findText(target);
    while (searchResult !== null) {
      var thisElement = searchResult.getElement();
      var thisElementText = thisElement.asText();
      // thisElementText.setAttributes(mystyle);
      thisElementText.setAttributes(searchResult.getStartOffset(), searchResult.getEndOffsetInclusive(),mystyle);    
      searchResult = thisEl.findText(target, searchResult);
    };      
  }
  
}
