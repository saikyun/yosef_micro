'use strict';

var game = game || {};

(() => {
	let normie = game.units.normie;
	let set_status = game.units.set_status;
	let update_status = game.units.update_status;
	let get_status = game.units.get_status;
	let delay = game.units.delay;
	let create_attack = game.units.create_attack;

	let rand = game.maths.rand;
	let randi = game.maths.randi;
	let add_vec = game.maths.add_vec;
	let angle_vel_to_delta = game.maths.angle_vel_to_delta;
	let between = game.maths.between;

	let fireball = (unit, teams) => {
		let enemy_team;
		for (let team in teams) {
			if (team != unit.statuses.team) {
				enemy_team = teams[team];
				break;
			}
		}

		if (enemy_team == null) { return; }

		let target = enemy_team[
			randi(0,
				 enemy_team.length)
		];

		let start_vel = 10;
		let decline_func = vel => Math.sqrt(Math.pow(vel, 2) - Math.pow(vel, 2) * 0.1);
		let min_vel = 1.5;

		let attack = create_attack(
			unit,
			{ enemies: [
				{ status: "health",
				  method: health => health - 300 }
			] },
			// update
			() => {
				attack.statuses.trail.push(attack.statuses.pos);

				if (target.statuses.dead === true) {
					attack.statuses.dead = true;
				}

				update_status(
					attack,
					"vel",
					decline_func);

				if (attack.statuses.vel < min_vel) { attack.statuses.vel = min_vel; }

				let target_pos = add_vec(target.statuses.pos,
										 target.statuses.vel);
				let pos = attack.statuses.pos;

				let angle_fix = angle => {
					while (angle > 2 * Math.PI) { angle -= 2 * Math.PI; }
					while (angle < 0) { angle += 2 * Math.PI; }
					
					return angle;
				};
				
				let poses_angle = angle_fix(Math.atan2(target_pos[1] - pos[1],
													   target_pos[0] - pos[0]));

				let current_dir = attack.statuses.dir;
				
				let change_in_dir =
					(angle_fix(poses_angle - current_dir) < Math.PI ?
					 1 : -1) * 0.2;

				if (between(-0.05, poses_angle - current_dir, 0.05)) {
					change_in_dir = poses_angle - current_dir;
				}

				attack.statuses.dir += change_in_dir;

				attack.statuses.dir = angle_fix(attack.statuses.dir);

				let delta = angle_vel_to_delta(
					attack.statuses.dir,
					attack.statuses.vel
				);

				update_status(
					attack,
					"pos",
					add_vec,
					delta
				);

				attack.statuses.size = [Math.abs(delta[0]) + 1, Math.abs(delta[1]) + 1];
			},
			
			{
				pos: add_vec(
					get_status(unit, "pos"),
					[-(get_status(unit, "dir")[0]
					   + (-1
						  * get_status(unit, "dir")[1])),
					 get_status(unit, "dir")[1]]
				),
				vel: start_vel,
				size: [1, 1],
				dir: Math.PI * rand(1.25, 1.75),
				alive_for: 0,
				trail: [],
			}
		);

		return attack;
	};

	let mage = (pos) => {
		let unit = normie(pos);

		set_status(unit, "job", "mage");

		unit.attack = (teams) => {
			if (get_status(unit, "delay", 0) <= 0) {
				delay(unit, 50);
				return fireball(unit, teams);
			}
		};
		unit.move = () => {
			if (get_status(unit, "delay", 0) > 0) {
				update_status(
					unit,
					"delay",
					delay => delay - 1,
					get_status(unit, "delay"));
			}
		};

		return unit;
	};

	game.units.mage = mage;
})();
