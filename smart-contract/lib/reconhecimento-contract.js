/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Contract } = require('fabric-contract-api');
let cicloAtivo = false;
const { v4: uuidv4 } = require('uuid');

class ReconhecimentoContract extends Contract {
    async usuarioExists(ctx, usuarioID) {
        const buffer = await ctx.stub.getState(usuarioID);
        return (!!buffer && buffer.length > 0);
    }

    async createUsuario(ctx, usuarioID, value) {
        const exists = await this.usuarioExists(ctx, usuarioID);
        if (exists) {
            throw new Error(`The usuario ${usuarioID} already exists`);
        }
        const asset = {
            id: usuarioID,
            chave:uuidv4(),
            hash: value,
            saldoRetirada: 0,
            saldoParaEnviar: 0,
        };
        const buffer = Buffer.from(JSON.stringify(asset));
        await ctx.stub.putState(usuarioID, buffer);
    }

    async readUsuario(ctx, usuarioID) {
        const exists = await this.usuarioExists(ctx, usuarioID);
        if (!exists) {
            throw new Error(`The usuario ${usuarioID} does not exist`);
        }
        const buffer = await ctx.stub.getState(usuarioID);
        const asset = JSON.parse(buffer.toString());
        return asset;
    }

    async deleteUsuario(ctx, usuarioID) {
        const exists = await this.usuarioExists(ctx, usuarioID);
        if (!exists) {
            throw new Error(`The usuario ${usuarioID} does not exist`);
        }
        await ctx.stub.deleteState(usuarioID);
    }
    async teste(ctx,usuario,chave){
        let buffer = await ctx.stub.getState(usuario);
        const usuinfo = JSON.parse(buffer.toString());
        let usuchave = usuinfo.chave;
        return JSON.stringify(usuinfo, usuchave);
    }

    async eviarSaldo(ctx, usuarioID1, usuarioChave, usuarioID2, value) {
        if (cicloAtivo === true) {
            const usuarioInfoBuffer = await ctx.stub.getState(usuarioID1);
            const usuarioInfo = JSON.parse(usuarioInfoBuffer.toString());

            const valueIsMultiple = value % 100;
            const exists1 = await this.usuarioExists(ctx, usuarioID1);
            const exists2 = await this.usuarioExists(ctx, usuarioID2);
            if (!exists1 && !exists2) {
                throw new Error('One of the users dont exist');
            }
            else if(usuarioInfo.chave !== usuarioChave){
                throw new Error('Incorrect key');
            }
            else if (valueIsMultiple !== 0) {
                throw new Error('The value must be multiple of 100');
            }
            let usuario1 = await ctx.stub.getState(usuarioID1);
            usuario1 = JSON.parse(usuario1);
            if ((usuario1.saldoParaEnviar - Number(value)) < 0) {
                throw new Error('Insufiscient funds');
            }

            const asset1 = {
                id: usuario1.usuarioID,
                chave:usuario1.chave,
                hash: usuario1.hash,
                saldoRetirada: usuario1.saldoRetirada,
                saldoParaEnviar: usuario1.saldoParaEnviar - Number(value)
            };
            const buffer1 = Buffer.from(JSON.stringify(asset1));
            await ctx.stub.putState(usuarioID1, buffer1);


            let usuario2 = await ctx.stub.getState(usuarioID2);
            usuario2 = JSON.parse(usuario2);
            const asset2 = {
                id: usuario2.usuarioID,
                chave:usuario2.chave,
                hash: usuario2.hash,
                saldoRetirada: usuario2.saldoRetirada + Number(value),
                saldoParaEnviar: usuario2.saldoParaEnviar
            };
            const buffer2 = Buffer.from(JSON.stringify(asset2));
            await ctx.stub.putState(usuarioID2, buffer2);
        } else {
            throw new Error('Ciclo precisa estar ativo para fazer transacao!');
        }
    }

    async iniciaCiclo(ctx) {
        const identity = ctx.clientIdentity;
        const checkAttr = identity.assertAttributeValue('RH', 'true');
        if (checkAttr) {
            const startKey = '0';
            const endKey = '999';
            const iterator = await ctx.stub.getStateByRange(startKey, endKey);
            cicloAtivo = true;


            // eslint-disable-next-line no-constant-condition
            while (true) {
                const res = await iterator.next();

                if (res.value && res.value.value.toString()) {
                    const Key = res.value.key;

                    let usuario = await ctx.stub.getState(Key);
                    usuario = JSON.parse(usuario);
                    const asset = {
                        id: usuario.id,
                        chave:usuario.chave,
                        hash: usuario.hash,
                        saldoRetirada: usuario.saldoRetirada,
                        saldoParaEnviar: 2000,
                    };
                    const buffer = Buffer.from(JSON.stringify(asset));
                    await ctx.stub.putState(Key, buffer);
                }
                if (res.done) {
                    await iterator.close();
                    return JSON.stringify('ciclo iniciado!');
                }
            }
        } else {
            throw new Error('You must be a RH to carry out this transaction!');
        }
    }

    async finalizaCiclo(ctx) {
        const identity = ctx.clientIdentity;
        const checkAttr = identity.assertAttributeValue('RH', 'true');
        if (checkAttr) {
            cicloAtivo = false;
        } else {
            throw new Error('You must be a RH to carry out this transaction!');
        }
    }

    async retirarPontos(ctx, usuarioID1, usuarioChave, value) {
        const usuarioInfoBuffer = await ctx.stub.getState(usuarioID1);
        const usuarioInfo = JSON.parse(usuarioInfoBuffer.toString());

        if (cicloAtivo === true) {
            const valueIsMultiple = value % 100;
            const exists1 = await this.usuarioExists(ctx, usuarioID1);
            const exists2 = await this.usuarioExists(ctx, '999');
            if (!exists1 && !exists2) {
                throw new Error('One of the users dont exist');
            }
            else if(usuarioInfo.chave !== usuarioChave){
                throw new Error('Incorrect key');
            }
            else if (valueIsMultiple !== 0) {
                throw new Error('The value must be multiple of 100');
            }

            let usuario1 = await ctx.stub.getState(usuarioID1);
            usuario1 = JSON.parse(usuario1);
            if ((usuario1.saldoRetirada - Number(value)) < 0) {
                throw new Error('Insufiscient funds');
            }
            else if(usuario1.saldoRetirada < 1000) {
                throw new Error('voce precisa de no minimo 1000 pontos para retirar');
            }

            const asset1 = {
                id: usuario1.usuarioID,
                chave:usuario1.chave,
                hash: usuario1.hash,
                saldoRetirada: usuario1.saldoRetirada - Number(value),
                saldoParaEnviar: usuario1.saldoParaEnviar
            };
            const buffer1 = Buffer.from(JSON.stringify(asset1));
            await ctx.stub.putState(usuarioID1, buffer1);


            let usuario2 = await ctx.stub.getState('999');
            usuario2 = JSON.parse(usuario2);
            const asset2 = {
                id: usuario2.usuarioID,
                chave:usuario2.chave,
                hash: usuario2.hash,
                saldoRetirada: usuario2.saldoRetirada + Number(value),
                saldoParaEnviar: usuario2.saldoParaEnviar
            };
            const buffer2 = Buffer.from(JSON.stringify(asset2));
            await ctx.stub.putState('999', buffer2);
        } else {
            throw new Error('Ciclo precisa estar ativo para fazer transacao!');
        }
    }
}

module.exports = ReconhecimentoContract;
