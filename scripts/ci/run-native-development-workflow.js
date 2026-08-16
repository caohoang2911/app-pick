#!/usr/bin/env node

const { spawnSync } = require('child_process');
const { createInterface } = require('readline/promises');
const { stdin, stdout } = require('process');
const appJson = require('../../app.json');

const WORKFLOW_FILE = '.eas/workflows/native-development.yml';
const GIT_REF = 'dev-deploy';
const DEFAULT_RELEASE_NOTES = 'Development native build';

const TARGETS = [
  {
    value: 'android',
    label: 'Android APK',
    details: 'profile dev, channel development',
  },
  {
    value: 'ios-device',
    label: 'iOS device',
    details: 'profile dev-device, internal distribution',
  },
  {
    value: 'ios-testflight',
    label: 'iOS TestFlight',
    details: 'profile dev, upload TestFlight',
  },
  {
    value: 'android-ios-testflight',
    label: 'Android APK + iOS TestFlight',
    details: 'build và phát hành cả hai nền tảng',
  },
];

function getOption(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function runGit(args) {
  const result = spawnSync('git', args, { encoding: 'utf8' });
  if (result.status !== 0) {
    console.error(
      result.stderr.trim() || `Không chạy được git ${args.join(' ')}`,
    );
    process.exit(1);
  }
  return result.stdout.trim();
}

function validateReleaseRef(dryRun) {
  if (dryRun) return;

  const status = runGit(['status', '--porcelain']);
  if (status) {
    console.error(
      'Working tree chưa clean. Commit và push thay đổi trước khi tạo native build từ --ref dev-deploy.',
    );
    process.exit(1);
  }

  const head = runGit(['rev-parse', 'HEAD']);
  const remoteHead = runGit(['rev-parse', `origin/${GIT_REF}`]);
  if (head !== remoteHead) {
    console.error(
      `HEAD (${head.slice(0, 7)}) chưa khớp origin/${GIT_REF} (${remoteHead.slice(0, 7)}). Push đúng branch trước khi build.`,
    );
    process.exit(1);
  }
}

function findTarget(input) {
  const normalized = input.trim().toLowerCase();
  const numericChoice = Number(normalized);

  if (
    Number.isInteger(numericChoice) &&
    numericChoice >= 1 &&
    numericChoice <= TARGETS.length
  ) {
    return TARGETS[numericChoice - 1];
  }

  return TARGETS.find((target) => target.value === normalized);
}

function printTargets() {
  console.log('\nChọn native build development:');
  TARGETS.forEach((target, index) => {
    console.log(`  ${index + 1}. ${target.label} — ${target.details}`);
  });
}

function runWorkflow(target, releaseNotes, dryRun) {
  const args = [
    'workflow:run',
    WORKFLOW_FILE,
    '--ref',
    GIT_REF,
    '--non-interactive',
    '-F',
    `target=${target.value}`,
    '-F',
    `release_notes=${releaseNotes}`,
  ];

  console.log('\nCấu hình sẽ chạy:');
  console.log(`  Target: ${target.label}`);
  console.log(`  Git ref: ${GIT_REF}`);
  console.log(`  Runtime: ${appJson.expo.runtimeVersion}`);
  console.log(`  Release notes: ${releaseNotes}`);

  if (dryRun) {
    console.log(`\n[dry-run] eas ${args.join(' ')}`);
    return;
  }

  const result = spawnSync('eas', args, { stdio: 'inherit' });

  if (result.error) {
    console.error(`Không chạy được EAS CLI: ${result.error.message}`);
    process.exit(1);
  }

  process.exit(result.status ?? 1);
}

async function main() {
  const requestedTarget = getOption('--target');
  const requestedReleaseNotes = getOption('--release-notes');
  const dryRun = process.argv.includes('--dry-run');
  validateReleaseRef(dryRun);
  let target = requestedTarget ? findTarget(requestedTarget) : undefined;
  let releaseNotes = requestedReleaseNotes?.trim();

  if (requestedTarget && !target) {
    console.error(`Target không hợp lệ: ${requestedTarget}`);
    process.exit(1);
  }

  if (target && releaseNotes) {
    runWorkflow(target, releaseNotes, dryRun);
    return;
  }

  if (!stdin.isTTY || !stdout.isTTY) {
    console.error(
      'Terminal không hỗ trợ prompt. Truyền --target và --release-notes để chạy non-interactive.',
    );
    process.exit(1);
  }

  const prompt = createInterface({ input: stdin, output: stdout });

  try {
    if (!target) {
      printTargets();
      const answer = await prompt.question('Lựa chọn [1]: ');
      target = findTarget(answer || '1');

      if (!target) {
        console.error('Lựa chọn không hợp lệ.');
        process.exitCode = 1;
        return;
      }
    }

    if (!releaseNotes) {
      const answer = await prompt.question(
        `Release notes [${DEFAULT_RELEASE_NOTES}]: `,
      );
      releaseNotes = answer.trim() || DEFAULT_RELEASE_NOTES;
    }

    console.log('\nCấu hình sẽ chạy:');
    console.log(`  Target: ${target.label}`);
    console.log(`  Git ref: ${GIT_REF}`);
    console.log(`  Runtime: ${appJson.expo.runtimeVersion}`);
    console.log(`  Release notes: ${releaseNotes}`);

    const confirmation = await prompt.question(
      'Xác nhận tạo native build trên EAS? [y/N]: ',
    );

    if (!['y', 'yes'].includes(confirmation.trim().toLowerCase())) {
      console.log('Đã hủy, chưa tạo build.');
      return;
    }
  } finally {
    prompt.close();
  }

  runWorkflow(target, releaseNotes, dryRun);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
