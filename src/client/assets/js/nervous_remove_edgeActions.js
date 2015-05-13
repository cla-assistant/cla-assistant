/***********************
* Adobe Edge Animate Composition Actions
*
* Edit this file with caution, being careful to preserve 
* function signatures and comments starting with 'Edge' to maintain the 
* ability to interact with these actions from within Adobe Edge Animate
*
***********************/
(function($, Edge, compId){
var Composition = Edge.Composition, Symbol = Edge.Symbol; // aliases for commonly used Edge classes

   //Edge symbol: 'stage'
   (function(symbolName) {
      
      
      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 0, function(sym, e) {
         // insert code here
         sym.play(0);

      });
      //Edge binding end

      // Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 687, function(sym, e) {
      //    sym.play (0);

      // });
      // //Edge binding end

      // Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 850, function(sym, e) {
      //    symp.play (0);

      // });
      //Edge binding end

   })("stage");
   //Edge symbol end:'stage'

})(window.jQuery || AdobeEdge.$, AdobeEdge, "EDGE-216448673");