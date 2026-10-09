export function normalizeContact(contact:string){
    let normalizaContact="";
    if(contact.includes('@')){
        return normalizaContact=contact.trim().toLowerCase();
    }else{
        return normalizaContact=contact.replace(/[\s()-_[]{}]/g,'');
    }
}   