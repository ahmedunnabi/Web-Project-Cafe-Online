const r = require('rethinkdb');

const fetchByID = (db, table, id) => {
    return new Promise ((resolve, reject) => {
        r.table(table).get(id).run(db, (err, result) => {
            if (!err) {
                if (!result) reject('failed at fetch by ID')
                else resolve(result)
            } else reject(err)
        });
    })
}

const fetchAll = (db, table) => {
    return new Promise ((resolve, reject) => {
        r.table(table).run(db, (err, cursor) => {
            if (err) throw err;
            cursor.toArray((err,result) => {
                if (err) reject(err);
                else resolve(result)
            })
        })
    })     
}

const insertDoc = (db, table, data, id = null) => {
    return new Promise ((resolve, reject) => {
        const newData = {...data}
        if (id !== null){
            newData.id = String(id);
        }
        r.table(table).insert(newData).run(db, (err, result) => {
            if (!err)
                resolve(true)
            else 
                reject(err)
        })
    })
}

const deleteDoc = (db, table, id) => {
    return new Promise ((resolve, reject) => {
        r.table(table).get(id).delete().run(db, (err, result) => {
            if (err) {
                reject(false)
            } else resolve(true)
        })
    })
}

const updateDoc = (db, table, id, newBody) => {
    console.log('in updae')
    return new Promise((resolve, reject) => {
        r.table(table).get(id).update(newBody).run(db,(err, result) => {
            if (!err) {
                if (result.skipped==0){   
                    resolve('done')
                } else {
                    reject('failed')
                }
            } else reject(err)
        })
    })
}

module.exports = {
    insertDoc,
    fetchByID,
    fetchAll,
    deleteDoc,
    updateDoc
}