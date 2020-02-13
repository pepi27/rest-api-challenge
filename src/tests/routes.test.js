// make test based on challenge requirements
// napravi testove po uzoru na challenge
import request from 'supertest';
import app from '../index';

let server;
let agent;

beforeEach(done => {
	server = app.listen(4000, err => {
		if (err) {
			return done(err);
		}
		agent = request.agent(server);
		done();
	});
});

afterEach(done => {
	return server && server.close(done);
});

describe('Post /pricing-models', () => {
	it('should add one pricing model and return id', async () => {
		const response = await agent.post('/pricing-models')
			.send({
				name: 'test pricing model'
			});
		expect(response.status).toBe(201);
		expect(response.type).toBe('application/json');
		expect(response.body.status).toBe('success');
		expect(response.body.data).toHaveProperty('id');
	});
});

describe('Get /pricing-models', () => {
	it('should return all pricing models and default price configuration', async () => {
		const response = await agent.get('/pricing-models');
		expect(response.status).toBe(200);
		expect(response.type).toBe('application/json');
		expect(response.body.status).toBe('success');
		expect(response.body.data[0]).toHaveProperty('pricing');
	});
});


describe('Get /pricing-models/:id', () => {
	it('should get one pricing model and pricing configuration', async () => {
		const response = await agent.get('/pricing-models/1');
		expect(response.status).toBe(200);
		expect(response.type).toBe('application/json');
		expect(response.body.status).toBe('success');
		expect(response.body.data).toHaveProperty('pricing');
	});
	it('should show no pricing model error', async () => {
		const response = await agent.get('/pricing-models/0');
		expect(response.status).toBe(404);
		expect(response.type).toBe('application/json');
		expect(response.body.status).toBe('error');
		expect(response.body.message).toBe('No such pricing model');
	});
});

describe('Put /pricing-models/:id', () => {
	it('should update one pricing model not affecting pricing configuration', async () => {
		const input = {
			name: 'edited pricing model'
		};
		const id = 1;
		const response = await agent.put(`/pricing-models/${1}`).send(input);
		expect(response.status).toBe(200);
		expect(response.type).toBe('application/json');
		expect(response.body.status).toBe('success');
		expect(response.body.data).toHaveProperty('id', id.toString());
		expect(response.body.data).toHaveProperty('name', input.name);
	});
	it('should show no pricing model error', async () => {
		const response = await agent.put('/pricing-models/0')
			.send({
				name: 'edited pricing model'
			});
		expect(response.status).toBe(404);
		expect(response.type).toBe('application/json');
		expect(response.body.status).toBe('error');
		expect(response.body.message).toBe('No such pricing model');
	});
});

describe('Post /pricing-models/:id/prices', () => {
	it('should add one pricing configuration to pricing model', async () => {
		const input = {
			price: 7,
			name: '17 minutes',
			value: 17
		};
		const id = 1;
		const response = await agent.post(`/pricing-models/${id}/prices`).send(input);
		expect(response.status).toBe(201);
		expect(response.type).toBe('application/json');
		expect(response.body.status).toBe('success');
		expect(response.body.data).toHaveProperty('id', id.toString());
		expect(response.body.data).toHaveProperty('name');
		expect(response.body.data).toHaveProperty('pricing.price', input.price.toString());
		expect(response.body.data).toHaveProperty('pricing.name', input.name);
		expect(response.body.data).toHaveProperty('pricing.value', input.value.toString());
	});
	it('should show no pricing model error', async () => {
		const response = await agent.post('/pricing-models/0/prices')
			.send({
				price: 4,
				name: 'test 17 minutes',
				value: 17
			});
		expect(response.status).toBe(404);
		expect(response.type).toBe('application/json');
		expect(response.body.status).toBe('error');
		expect(response.body.message).toBe('No such pricing model');
	});
});

describe('Get /pricing-models/:id/prices', () => {
	it('should get one pricing configuration', async () => {
		const response = await agent.get('/pricing-models/1/prices');
		expect(response.status).toBe(200);
		expect(response.type).toBe('application/json');
		expect(response.body.status).toBe('success');
		expect(response.body.data).toHaveProperty('pricing');
	});
	it('should show no pricing model error', async () => {
		const response = await agent.get('/pricing-models/0/prices');
		expect(response.status).toBe(404);
		expect(response.type).toBe('application/json');
		expect(response.body.status).toBe('error');
		expect(response.body.message).toBe('No such pricing model');

	});
});

describe('Delete /pricing-models/:pm_id/prices/:price_id', () => {
	it('should remove prices from pricing model', async () => {
		const response = await agent.delete('/pricing-models/1/prices/1');
		expect(response.status).toBe(204);
	});
	it('should show no pricing model error', async () => {
		const response = await agent.delete('/pricing-models/0/prices/1');
		expect(response.status).toBe(404);
		expect(response.type).toBe('application/json');
		expect(response.body.status).toBe('error');
		expect(response.body.message).toBe('No such pricing model');

	});
	it('should show no price model error', async () => {
		const response = await agent.delete('/pricing-models/1/prices/0');
		expect(response.status).toBe(404);
		expect(response.type).toBe('application/json');
		expect(response.body.status).toBe('error');
		expect(response.body.message).toBe('No such price model');
	});
});

describe('Put /machines/:machine_id/prices/:pm_id', () => {
	it('should set pricing for individual model', async () => {
		const response = await agent.put('/machines/1/prices/1');
		expect(response.status).toBe(200);
		expect(response.type).toBe('application/json');
		expect(response.body.status).toBe('success');
		expect(response.body.data).toHaveProperty('id', '1');
		expect(response.body.data).toHaveProperty('pricing_id', '1');
	});
	it('should show no machine model error', async () => {
		const response = await agent.put('/machines/0/prices/1');
		expect(response.status).toBe(404);
		expect(response.type).toBe('application/json');
		expect(response.body.status).toBe('error');
		expect(response.body.message).toBe('No such machine model');
	});
	it('should show no price model error', async () => {
		const response = await agent.put('/machines/1/prices/0');
		expect(response.status).toBe(404);
		expect(response.type).toBe('application/json');
		expect(response.body.status).toBe('error');
		expect(response.body.message).toBe('No such pricing model');
	});
});

describe('Delete /machines/:machine_id/prices/:pm_id', () => {
	it('should remove pricing model from mahcine', async () => {
		const response = await agent.delete('/machines/1/prices/1');
		expect(response.status).toBe(204);
	});
	it('should show error no machine model', async () => {
		const response = await agent.delete('/machines/0/prices/1');
		expect(response.status).toBe(404);
		expect(response.type).toBe('application/json');
		expect(response.body.status).toBe('error');
		expect(response.body.message).toBe('No such machine model');
	});
	it('should show error no pricing model', async () => {
		const response = await agent.delete('/machines/1/prices/0');
		expect(response.status).toBe(404);
		expect(response.type).toBe('application/json');
		expect(response.body.status).toBe('error');
		expect(response.body.message).toBe('No such machine model');
	});

});

describe('Get /machines/:id/prices', () => {
	it('should show pricing model and price or default price configuration for a given machine', async () => {
		const response = await agent.get('/machines/1/prices');
		expect(response.status).toBe(200);
		expect(response.type).toBe('application/json');
		expect(response.body.status).toBe('success');
		expect(response.body.data).toHaveProperty('id', '1');
		// expect pricing either way
		expect(response.body.data).toHaveProperty('pricing');
	});
	it('should show error no machine model', async () => {
		const response = await agent.get('/machines/0/prices');
		expect(response.status).toBe(404);
		expect(response.type).toBe('application/json');
		expect(response.body.status).toBe('error');
		expect(response.body.message).toBe('No such machine model');
	});
});
