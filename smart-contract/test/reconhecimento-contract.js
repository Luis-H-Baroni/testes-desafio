/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { ChaincodeStub, ClientIdentity } = require('fabric-shim');
const { ReconhecimentoContract } = require('..');
const winston = require('winston');

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

chai.should();
chai.use(chaiAsPromised);
chai.use(sinonChai);

class TestContext {

    constructor() {
        this.stub = sinon.createStubInstance(ChaincodeStub);
        this.clientIdentity = sinon.createStubInstance(ClientIdentity);
        this.logger = {
            getLogger: sinon.stub().returns(sinon.createStubInstance(winston.createLogger().constructor)),
            setLevel: sinon.stub(),
        };
    }

}

describe('ReconhecimentoContract', () => {

    let contract;
    let ctx;

    beforeEach(() => {
        contract = new ReconhecimentoContract();
        ctx = new TestContext();
        ctx.stub.getState.withArgs('1001').resolves(Buffer.from('{"value":"reconhecimento 1001 value"}'));
        ctx.stub.getState.withArgs('1002').resolves(Buffer.from('{"value":"reconhecimento 1002 value"}'));
    });

    describe('#reconhecimentoExists', () => {

        it('should return true for a reconhecimento', async () => {
            await contract.reconhecimentoExists(ctx, '1001').should.eventually.be.true;
        });

        it('should return false for a reconhecimento that does not exist', async () => {
            await contract.reconhecimentoExists(ctx, '1003').should.eventually.be.false;
        });

    });

    describe('#createReconhecimento', () => {

        it('should create a reconhecimento', async () => {
            await contract.createReconhecimento(ctx, '1003', 'reconhecimento 1003 value');
            ctx.stub.putState.should.have.been.calledOnceWithExactly('1003', Buffer.from('{"value":"reconhecimento 1003 value"}'));
        });

        it('should throw an error for a reconhecimento that already exists', async () => {
            await contract.createReconhecimento(ctx, '1001', 'myvalue').should.be.rejectedWith(/The reconhecimento 1001 already exists/);
        });

    });

    describe('#readReconhecimento', () => {

        it('should return a reconhecimento', async () => {
            await contract.readReconhecimento(ctx, '1001').should.eventually.deep.equal({ value: 'reconhecimento 1001 value' });
        });

        it('should throw an error for a reconhecimento that does not exist', async () => {
            await contract.readReconhecimento(ctx, '1003').should.be.rejectedWith(/The reconhecimento 1003 does not exist/);
        });

    });

    describe('#updateReconhecimento', () => {

        it('should update a reconhecimento', async () => {
            await contract.updateReconhecimento(ctx, '1001', 'reconhecimento 1001 new value');
            ctx.stub.putState.should.have.been.calledOnceWithExactly('1001', Buffer.from('{"value":"reconhecimento 1001 new value"}'));
        });

        it('should throw an error for a reconhecimento that does not exist', async () => {
            await contract.updateReconhecimento(ctx, '1003', 'reconhecimento 1003 new value').should.be.rejectedWith(/The reconhecimento 1003 does not exist/);
        });

    });

    describe('#deleteReconhecimento', () => {

        it('should delete a reconhecimento', async () => {
            await contract.deleteReconhecimento(ctx, '1001');
            ctx.stub.deleteState.should.have.been.calledOnceWithExactly('1001');
        });

        it('should throw an error for a reconhecimento that does not exist', async () => {
            await contract.deleteReconhecimento(ctx, '1003').should.be.rejectedWith(/The reconhecimento 1003 does not exist/);
        });

    });

});
