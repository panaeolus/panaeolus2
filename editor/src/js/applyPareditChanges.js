var emacs = typeof ace !== 'undefined' ? ace.acequire("ace/keyboard/emacs") : null;

function undoStackSize(ed) {
    return ed.session.getUndoManager().$undoStack.length;
}

module.exports = function applyPareditChanges(ed, changes, newIndex, indent) {
    if(!emacs) {
        emacs = typeof ace !== 'undefined' ? ace.acequire("ace/keyboard/emacs") : null;
    }
    // ed: ace editor instance
    // changes:  alist of insert/remove instructions generated by
    //           paredit.editor
    // newIndex: where to put the cursor after applying the changes
    if (!changes || !changes.length) return;
    var nUndos = undoStackSize(ed);
    changes.forEach(function(ea) {
        var type = ea[0];
        if (type === 'insert') {
            ed.session.insert(
                ed.session.doc.indexToPosition(ea[1]), ea[2]);
        } else if (type === 'remove') {
            var range = {
                start: ed.session.doc.indexToPosition(ea[1]),
                end: ed.session.doc.indexToPosition(ea[1]+ea[2])
            }
            var killRingString = ed.session.getTextRange(range);
            if (killRingString.length > 1 && emacs) emacs.killRing.add(killRingString);
            ed.session.remove(range);
        }
    });

    if (newIndex)
        ed.selection.moveToPosition(
            ed.session.doc.indexToPosition(newIndex));

    if (!indent) ed.session.markUndoGroup();
    else {
        var ast = ed.session.$ast = paredit.parse(ed.getValue(), {addSourceForLeafs: true});
        if (!ast || (ast.errors && ast.errors.length)) return;
        var indentStart = typeof indent === "object" ?
                          indent.start : changes[0][1],
            indentEnd = typeof indent === "object" ?
                        indent.end : changes[changes.length-1][1];
        ace.ext.lang.paredit.CodeNavigator.indent(ed,
                                                  {from: indentStart, to: indentEnd})
        if (undoStackSize(ed) - nUndos >= 2)
            mergeLast2Undos(ed);
    }

}
