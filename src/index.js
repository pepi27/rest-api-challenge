import Koa from 'koa';
import Router from 'koa-router';
import bodyParser from 'koa-bodyparser';
import pool from '../config';
const fs = require('fs');

const app = new Koa();
const PORT = process.env.PORT || 1337;
const router = new Router();

let defaultPricing = {};
fs.readFile('./prices.json', 'utf8', function (err, data) {
	if (err) {
		throw err;
	}
	try {
		defaultPricing = JSON.parse(data).default_pricing;
	} catch (e) {
		console.error(e);
	}
});

router
	.use(bodyParser())
	.get('/', (ctx, next) => {
		ctx.body = 'hello world';
	})
	// get all pricing models
	.get('/pricing-models', async ctx => {
		try {
			const pricingModels = await pool.query(
				'SELECT * FROM pricing ORDER BY id ASC'
			);

			// merge db pricing with default pricing
			for (let i = 0; i < pricingModels.rows.length; i++) {
				const prices = await pool.query('SELECT price, name, value FROM price WHERE pricing_id = $1', [pricingModels.rows[i].id]);
				pricingModels.rows[i].pricing = prices.rows.concat(defaultPricing);
			}

			ctx.body = {
				status: 'success',
				data: pricingModels.rows
			};
		} catch (err) {
			console.log(err);
		}
	})
	// add a new pricing model
	.post('/pricing-models', async ctx => {
		const text = 'INSERT INTO pricing(name) VALUES($1) RETURNING id';
		const values = [ctx.request.body.name];
		try {
			const pricingModel = await pool.query(text, values);
			ctx.status = 201;
			ctx.body = {
				status: 'success',
				data: pricingModel.rows[0]
			};
		} catch (err) {
			ctx.status = 400;
			ctx.body = {
				status: 'error',
				message: err.message || 'Sorry, an error has occurred.'
			};
		}
	})
	// get one pricing model
	.get('/pricing-models/:id', async ctx => {
		const getPricingText = 'SELECT * FROM pricing WHERE id = $1';
		const getPricingValues = [ctx.params.id];
		const getPricesText = 'SELECT price, name, value FROM price WHERE pricing_id = $1';
		const getPricesValues = [ctx.params.id];
		try {
			const pricingModel = await pool.query(getPricingText, getPricingValues);
			if (pricingModel.rows.length) {

				const prices = await pool.query(getPricesText, getPricesValues);

				const pricingModelWithPrices = {
					id: pricingModel.rows[0].id,
					name: pricingModel.rows[0].name,
					// the default pricing was specified only for get all method
					// it can be added by replacing the lines below
					// pricing: prices.rows.concat(defaultPricing)
					pricing: prices.rows
				};

				ctx.body = {
					status: 'success',
					data: pricingModelWithPrices
				};
			} else {
				ctx.status = 404;
				ctx.body = {
					status: 'error',
					message: 'No such pricing model'
				};
			}
		} catch (err) {
			ctx.status = 400;
			ctx.body = {
				status: 'error',
				message: err.message || 'Sorry, an error has occurred.'
			};
		}
	})
	// update one pricing model
	.put('/pricing-models/:id', async ctx => {
		const getText = 'SELECT * FROM pricing WHERE id = $1';
		const getValues = [ctx.params.id];
		const updateText =
			'UPDATE pricing SET name = $1 WHERE id = $2 RETURNING *';
		const updateValues = [ctx.request.body.name, ctx.params.id];
		try {
			const pricingModel = await pool.query(getText, getValues);
			if (!pricingModel.rows.length) {
				ctx.status = 404;
				ctx.body = {
					status: 'error',
					message: 'No such pricing model'
				};
			} else {
				const updatedPricing = await pool.query(
					updateText,
					updateValues
				);
				ctx.body = {
					status: 'success',
					data: updatedPricing.rows[0]
				};
			}
		} catch (err) {
			ctx.status = 400;
			ctx.body = {
				status: 'error',
				message: err.message || 'Sorry, an error has occurred.'
			};
		}
	})
	// get prices for given model
	.get('/pricing-models/:id/prices', async ctx => {
		const getPricingText = 'SELECT * FROM pricing WHERE id = $1';
		const getPricingValues = [ctx.params.id];
		const getPriceText =
			'SELECT * FROM price WHERE pricing_id = $1 ORDER BY id ASC';
		const getPriceValues = [ctx.params.id];
		try {
			const pricingModel = await pool.query(
				getPricingText,
				getPricingValues
			);

			if (!pricingModel.rows.length) {
				ctx.status = 404;
				ctx.body = {
					status: 'error',
					message: 'No such pricing model'
				};
			} else {
				const priceModel = await pool.query(
					getPriceText,
					getPriceValues
				);
				const pricingModelPrices = {
					pricing: priceModel.rows
				};
				ctx.body = {
					status: 'success',
					data: pricingModelPrices
				};
			}
		} catch (err) {
			ctx.status = 400;
			ctx.body = {
				status: 'error',
				message: err.message || 'Sorry, an error has occurred.'
			};
		}
	})
	// update pricing configuration for pricing model
	.post('/pricing-models/:id/prices', async ctx => {
		const getPricingText = 'SELECT * FROM pricing WHERE id = $1';
		const getPricingValues = [ctx.params.id];
		const addPricingText =
			'INSERT INTO price (price, name, value, pricing_id) VALUES($1, $2, $3, $4) RETURNING *';
		const addPricingValue = [
			ctx.request.body.price,
			ctx.request.body.name,
			ctx.request.body.value,
			ctx.params.id
		];

		try {
			const pricingModel = await pool.query(
				getPricingText,
				getPricingValues
			);
			if (!pricingModel.rows.length) {
				ctx.status = 404;
				ctx.body = {
					status: 'error',
					message: 'No such pricing model'
				};
			} else {
				const price = await pool.query(addPricingText, addPricingValue);
				const pricingModelWithPriceConfiguration = {
					id: pricingModel.rows[0].id,
					name: pricingModel.rows[0].name,
					pricing: price.rows[0]
				};
				ctx.status = 201;
				ctx.body = {
					status: 'success',
					data: pricingModelWithPriceConfiguration
				};
			}
		} catch (err) {
			ctx.body = {
				status: 'error',
				message: err.message || 'Sorry, an error has occurred.'
			};
		}
	})
	// remove pricing configuration from pricing model
	.delete('/pricing-models/:pm_id/prices/:price_id', async ctx => {
		const getPricingText = 'SELECT * FROM pricing WHERE id = $1';
		const getPricingValues = [ctx.params.pm_id];
		const getPriceText = 'SELECT * FROM price WHERE id = $1 AND pricing_id = $2';
		const getPriceValues = [ctx.params.price_id, ctx.params.pm_id];
		const removePriceText =
			'UPDATE price SET pricing_id = null WHERE id = $1';
		const removePriceValue = [ctx.params.price_id];

		try {
			const pricingModel = await pool.query(
				getPricingText,
				getPricingValues
			);
			const priceModel = await pool.query(getPriceText, getPriceValues);

			if (!pricingModel.rows.length) {
				ctx.status = 404;
				ctx.body = {
					status: 'error',
					message: 'No such pricing model'
				};
			} else if (!priceModel.rows.length) {
				ctx.status = 404;
				ctx.body = {
					status: 'error',
					message: 'No such price model'
				};
			} else {
				pool.query(removePriceText, removePriceValue);
				ctx.status = 204;
			}
		} catch (err) {
			ctx.status = 400;
			ctx.body = {
				status: 'error',
				message: err.message || 'Sorry, an error has occurred.'
			};
		}
	})
	// set pricing model for an individual machine
	.put('/machines/:machine_id/prices/:pm_id', async ctx => {
		const getMachineText = 'SELECT * FROM machine WHERE id = $1';
		const getMachineValues = [ctx.params.machine_id];
		const getPricingText = 'SELECT * FROM pricing WHERE id = $1';
		const getPricingValues = [ctx.params.pm_id];
		const updateMachinePricingText =
			'UPDATE machine SET pricing_id = $1 WHERE id = $2 RETURNING *';
		const updateMachineValues = [ctx.params.pm_id, ctx.params.machine_id];

		try {
			const machineModel = await pool.query(
				getMachineText,
				getMachineValues
			);
			const pricingModel = await pool.query(
				getPricingText,
				getPricingValues
			);

			if (!machineModel.rows.length) {
				ctx.status = 404;
				ctx.body = {
					status: 'error',
					message: 'No such machine model'
				};
			} else if (!pricingModel.rows.length) {
				ctx.status = 404;
				ctx.body = {
					status: 'error',
					message: 'No such pricing model'
				};
			} else {
				const updateMachinePricingModel = await pool.query(
					updateMachinePricingText,
					updateMachineValues
				);
				ctx.body = {
					status: 'success',
					data: updateMachinePricingModel.rows[0]
				};
			}
		} catch (err) {
			ctx.status = 400;
			ctx.body = {
				status: 'error',
				message: err.message || 'Sorry, an error has occurred.'
			};
		}
	})
	// remove pricing model from mahcine
	.delete('/machines/:machine_id/prices/:pm_id', async ctx => {
		const getMachineText =
			'SELECT * FROM machine WHERE id = $1 AND pricing_id = $2';
		const getMachineValues = [ctx.params.machine_id, ctx.params.pm_id];
		const removeMachinePricingText =
			'UPDATE machine SET pricing_id = null WHERE id = $1';
		const removeMachineValues = [ctx.params.machine_id];

		try {
			const machineModel = await pool.query(
				getMachineText,
				getMachineValues
			);

			if (!machineModel.rows.length) {
				ctx.status = 404;
				ctx.body = {
					status: 'error',
					message: 'No such machine model'
				};
			} else {
				await pool.query(removeMachinePricingText, removeMachineValues);
				ctx.status = 204;
			}
		} catch (err) {
			ctx.status = 400;
			ctx.body = {
				status: 'error',
				message: err.message || 'Sorry, an error has occurred.'
			};
		}
	})
	// get pricing model and price configuration for a given machine
	.get('/machines/:id/prices', async ctx => {
		const getMachineText = 'SELECT * FROM machine WHERE id = $1';
		const getMachineValues = [ctx.params.id];
		const getMachinePricingText =
			'SELECT * FROM price WHERE pricing_id = (SELECT pricing_id FROM machine WHERE id = $1) ORDER BY id ASC';
		const getMachinePricingValues = [ctx.params.id];

		try {
			const machineModel = await pool.query(
				getMachineText,
				getMachineValues
			);

			if (!machineModel.rows.length) {
				ctx.status = 404;
				ctx.body = {
					status: 'error',
					message: 'No such machine model'
				};
			} else {
				const machindeModelPricing = await pool.query(
					getMachinePricingText,
					getMachinePricingValues
				);
				const machineModelWithPricing = {
					id: machineModel.rows[0].id,
					name: machineModel.rows[0].name,
					pricing: machindeModelPricing.rows[0] ?
						machindeModelPricing.rows : defaultPricing
				};

				ctx.body = {
					status: 'success',
					data: machineModelWithPricing
				};
			}
		} catch (err) {
			ctx.status = 400;
			ctx.body = {
				status: 'error',
				message: err.message || 'Sorry, an error has occurred.'
			};
		}
	});

app.use(router.routes());

if (process.env.NODE_ENV !== 'test') {
	app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
}

module.exports = app;
