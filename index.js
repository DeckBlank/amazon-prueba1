// -------------- ARTILLERY (TEST DE CARGA) -------------------
//https://medium.com/the-andela-way/scaling-out-with-node-clusters-1dca4a39a2a
//npm i -g artillery
//npm list -g | grep artillery

//Setear el servidor en modo fork
//node server.js 8081 FORK
//artillery quick --count 50 -n 40 http://localhost:8081?max=100000 > result_fork.txt

//Setear el servidor en modo cluster
//node server.js 8082 CLUSTER
//artillery quick --count 50 -n 40 http://localhost:8082?max=100000 > result_cluster.txt

const express = require('express');
const cluster = require('cluster');
const os = require('os')
const { isPrime } = require('./is-prime');

// import express from 'express'
// import cluster from 'cluster'
// import * as os from 'os'
// import { isPrime } from './is-prime.js'

const modoCluster = process.argv.includes('CLUSTER')

/* --------------------------------------------------------------------------- */
/* MASTER */
if (modoCluster && cluster.isMaster) {
  const numCPUs = os.cpus().length

  console.log(`Número de procesadores: ${numCPUs}`)
  console.log(`PID MASTER ${process.pid}`)

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork()
  }

  cluster.on('exit', worker => {
    console.log('Worker', worker.process.pid, 'died', new Date().toLocaleString())
    cluster.fork()
  })
}
else {

  const app = express()

  app.get('/', (req, res) => {
    res.json({ msg: "HOLA" })
  })

  app.get('/suma', (req, res) => {
    const p1 = req.query.p1;
    const p2 = req.query.p2;

    if(!p1 || !p2)
      res.status(400).json({msg:"Pasamos los parametros"});

    const output = Number(p1) + Number(p2);

    res.status(200).json({out:output});
  })

  app.get('/primo', (req, res) => {
    const primes = []
    const max = Number(req.query.max) || 1000
    for (let i = 1; i <= max; i++) {
      if (isPrime(i)) primes.push(i)
    }
    res.json(primes)
  })

  const PORT = process.env.PORT || 8080
  app.listen(PORT, err => {
    if (!err) console.log(`Servidor express escuchando en el puerto ${PORT} - PID WORKER ${process.pid}`)
  })
}
